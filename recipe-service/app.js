const express = require('express');
const { Client } = require('pg');
const amqp = require('amqplib');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

const clientProm = require('prom-client');

const collectDefaultMetrics = clientProm.collectDefaultMetrics;
collectDefaultMetrics();

const httpRequestDurationMicroseconds = new clientProm.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'code'],
  buckets: [50, 100, 300, 500, 1000, 3000],
});

const app = express();

app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.route?.path || req.path, code: res.statusCode });
  });
  next();
});

const PORT = 5002;

// PostgreSQL connection
const client = new Client({
  user: 'postgres',
  host: 'recipe-db',
  database: 'recipe_db',
  password: 'password',
  port: 5432,
});

client.connect();

// RabbitMQ connection for RPC
let channel;
const connectRabbitMQ = async () => {
  const connection = await amqp.connect('amqp://guest:guest@rabbitmq');
  channel = await connection.createChannel();
  await channel.assertQueue('recipe_rpc_queue');
};

//set-up multer


app.use('/food_image', express.static(path.join(__dirname, 'food_image')));

// กำหนด storage สำหรับ multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'food_image')); // ให้ชี้ไปที่โฟลเดอร์ใน path จริง
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `recipe_${Date.now()}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });


app.post('/recipes/:id/upload-image', upload.single('image'), async (req, res) => {
  const recipeId = parseInt(req.params.id);
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

  const imageUrl = `/food_image/${req.file.filename}`;

  try {
    const result = await client.query(
      `UPDATE recipes SET image_url = $1 WHERE recipe_id = $2 RETURNING *`,
      [imageUrl, recipeId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    res.json({ message: 'Image uploaded successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Error updating image:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/recipes/:id/image', async (req, res) => {
  const recipeId = parseInt(req.params.id);
  try {
    const result = await client.query(`SELECT image_url FROM recipes WHERE recipe_id = $1`, [recipeId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.json({ imageUrl: result.rows[0].image_url });
  } catch (err) {
    console.error('Error fetching image URL:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CRUD Operations

// Create a new course
// Updated POST endpoint for recipes
app.post('/recipes', async (req, res) => {
  const { 
    recipe_name, 
    user_id, 
    image_url,
    cooking_time,
    description,
    difficulty,
    ingredients,
    steps
  } = req.body;
  
  // Start a transaction for atomicity
  try {
    await client.query('BEGIN');
    
    // 1. Insert the recipe and get the recipe_id
    const insertRecipeQuery = `
      INSERT INTO recipes (recipe_name, user_id, image_url, cooking_time, description, difficulty) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING recipe_id
    `;
    
    const recipeResult = await client.query(insertRecipeQuery, [
      recipe_name, 
      user_id, 
      image_url, 
      cooking_time,
      description,
      difficulty
    ]);
    
    const recipe_id = recipeResult.rows[0].recipe_id;
    
    // 2. Insert ingredients
    if (ingredients && ingredients.length > 0) {
      const ingredientValues = ingredients.map(ingredient => {
        return `(${recipe_id}, ${ingredient.ingredient_id}, ${ingredient.quantity})`;
      }).join(', ');
      
      // Bulk insert all ingredients
      await client.query(`
        INSERT INTO RecipeIngredients (recipe_id, ingredient_id, quantity)
        VALUES ${ingredientValues}
      `);
    }
    
    // 3. Insert steps
    if (steps && steps.length > 0) {
      const stepValues = steps.map(step => {
        // Escape single quotes in the instruction text
        const safeInstruction = step.instruction.replace(/'/g, "''");
        return `(${recipe_id}, ${step.step_number}, '${safeInstruction}')`;
      }).join(', ');
      
      // Bulk insert all steps
      await client.query(`
        INSERT INTO recipe_steps (recipe_id, step_number, instruction)
        VALUES ${stepValues}
      `);
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    
    res.status(201).json({ 
      message: 'Recipe created successfully', 
      recipe_id 
    });
    
  } catch (err) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error creating recipe:', err);
    res.status(500).json({ 
      error: 'Failed to create recipe', 
      details: err.message 
    });
  }
});


// Get all courses
app.get('/recipes', async (req, res) => {
  const recipeQuery = `
    SELECT 
      r.recipe_id,
      r.recipe_name,
      r.image_url,
      r.cooking_time,
      r.description,
      r.difficulty,
      r.user_id,
      i.ingredient_id,
      i.name AS ingredient_name,
      i.unit,
      ri.quantity
    FROM recipes r
    LEFT JOIN recipeingredients ri ON r.recipe_id = ri.recipe_id
    LEFT JOIN ingredients i ON ri.ingredient_id = i.ingredient_id
    ORDER BY r.recipe_id;
  `;

  const stepQuery = `
    SELECT recipe_id, step_number, instruction
    FROM recipe_steps
    ORDER BY recipe_id, step_number;
  `;

  try {
    const recipeResult = await client.query(recipeQuery);
    const stepResult = await client.query(stepQuery);

    // จัดกลุ่ม recipe
    const grouped = recipeResult.rows.reduce((acc, row) => {
      const {
        recipe_id, recipe_name, image_url, cooking_time,
        description, difficulty, user_id,
        ingredient_id, ingredient_name, unit, quantity
      } = row;

      if (!acc[recipe_id]) {
        acc[recipe_id] = {
          recipe_id,
          recipe_name,
          image_url,
          cooking_time,
          description,
          difficulty,
          user_id,
          ingredients: [],
          steps: []
        };
      }

      if (ingredient_id) {
        acc[recipe_id].ingredients.push({
          ingredient_id,
          ingredient_name,
          unit,
          quantity
        });
      }

      return acc;
    }, {});

    // เพิ่มขั้นตอนลงในแต่ละสูตร
    stepResult.rows.forEach(step => {
      const { recipe_id, step_number, instruction, image_url } = step;
      if (grouped[recipe_id]) {
        grouped[recipe_id].steps.push({
          step_number,
          instruction,
        });
      }
    });

    res.json(Object.values(grouped));
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send(err);
  }
});


// Get a single recipe by ID
app.get('/recipes/:id', async (req, res) => {
  const recipe_id = req.params.id;

  const recipeQuery = `
    SELECT 
        r.recipe_id,
        r.recipe_name,
        r.image_url,
        r.cooking_time,
        r.description,
        r.difficulty,
        r.user_id,
        i.ingredient_id,
        i.name AS ingredient_name,
        i.unit,
        ri.quantity
    FROM recipes r
    LEFT JOIN RecipeIngredients ri ON r.recipe_id = ri.recipe_id
    LEFT JOIN ingredients i ON ri.ingredient_id = i.ingredient_id
    WHERE r.recipe_id = $1
    ORDER BY r.recipe_id;
  `;

  const stepQuery = `
    SELECT step_number, instruction
    FROM recipe_steps
    WHERE recipe_id = $1
    ORDER BY step_number;
  `;

  try {
    const recipeResult = await client.query(recipeQuery, [recipe_id]);
    const stepResult = await client.query(stepQuery, [recipe_id]);

    if (recipeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    const recipe = {
      recipe_id: recipeResult.rows[0].recipe_id,
      recipe_name: recipeResult.rows[0].recipe_name,
      image_url: recipeResult.rows[0].image_url,
      cooking_time: recipeResult.rows[0].cooking_time,
      description: recipeResult.rows[0].description,
      difficulty: recipeResult.rows[0].difficulty,
      user_id: recipeResult.rows[0].user_id,
      ingredients: [],
      steps: []
    };

    recipeResult.rows.forEach(row => {
      if (row.ingredient_id) {
        recipe.ingredients.push({
          ingredient_id: row.ingredient_id,
          ingredient_name: row.ingredient_name,
          unit: row.unit,
          quantity: row.quantity
        });
      }
    });

    stepResult.rows.forEach(step => {
      recipe.steps.push({
        step_number: step.step_number,
        instruction: step.instruction
      });
    });

    res.json(recipe);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Server error');
  }
});

app.get('/recipes/user/:user_id', async (req, res) => {
  const user_id = req.params.user_id;

  const recipeQuery = `
    SELECT 
        r.recipe_id,
        r.recipe_name,
        r.image_url,
        r.cooking_time,
        r.description,
        r.difficulty,
        r.user_id,
        i.ingredient_id,
        i.name AS ingredient_name,
        i.unit,
        ri.quantity
    FROM recipes r
    LEFT JOIN RecipeIngredients ri ON r.recipe_id = ri.recipe_id
    LEFT JOIN ingredients i ON ri.ingredient_id = i.ingredient_id
    WHERE r.user_id = $1
    ORDER BY r.recipe_id;
  `;

  const stepQuery = `
    SELECT recipe_id, step_number, instruction
    FROM recipe_steps
    WHERE recipe_id IN (
      SELECT recipe_id FROM recipes WHERE user_id = $1
    )
    ORDER BY recipe_id, step_number;
  `;

  try {
    const recipeResult = await client.query(recipeQuery, [user_id]);
    const stepResult = await client.query(stepQuery, [user_id]);

    if (recipeResult.rows.length === 0) {
      return res.status(404).json({ message: 'No recipes found for this user' });
    }

    const recipeMap = {};

    // Group recipes and ingredients
    recipeResult.rows.forEach(row => {
      if (!recipeMap[row.recipe_id]) {
        recipeMap[row.recipe_id] = {
          recipe_id: row.recipe_id,
          recipe_name: row.recipe_name,
          image_url: row.image_url,
          cooking_time: row.cooking_time,
          description: row.description,
          difficulty: row.difficulty,
          user_id: row.user_id,
          ingredients: [],
          steps: []
        };
      }

      if (row.ingredient_id) {
        recipeMap[row.recipe_id].ingredients.push({
          ingredient_id: row.ingredient_id,
          ingredient_name: row.ingredient_name,
          unit: row.unit,
          quantity: row.quantity
        });
      }
    });

    // Group steps
    stepResult.rows.forEach(step => {
      if (recipeMap[step.recipe_id]) {
        recipeMap[step.recipe_id].steps.push({
          step_number: step.step_number,
          instruction: step.instruction
        });
      }
    });

    // Convert object to array
    const recipes = Object.values(recipeMap);

    res.json(recipes);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Server error');
  }
});



// delete a specific course
app.delete('/recipes/:id', async (req, res) => {
  const recipe_id = parseInt(req.params.id, 10);

  if (isNaN(recipe_id)) {
      return res.status(400).json({ message: 'Invalid recipe ID' });
  }

  try {
      await client.query('BEGIN');

      // ลบขั้นตอนการทำอาหารใน recipe_steps ก่อน
      await client.query(
          'DELETE FROM recipe_steps WHERE recipe_id = $1',
          [recipe_id]
      );

      // ลบวัตถุดิบใน recipeingredients
      await client.query(
          'DELETE FROM recipeingredients WHERE recipe_id = $1',
          [recipe_id]
      );

      // ลบสูตรอาหารจาก recipes
      const result = await client.query(
          'DELETE FROM recipes WHERE recipe_id = $1',
          [recipe_id]
      );

      await client.query('COMMIT');

      if (result.rowCount === 0) {
          return res.status(404).json({ message: 'Recipe not found' });
      }

      res.json({ message: 'Recipe deleted successfully' });

  } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error during delete recipe:', err);
      res.status(500).json({ message: 'Failed to delete recipe', error: err.message });
  }
});





app.patch('/recipes/:id', async (req, res) => {
  const recipe_id = req.params.id;
  const {
    recipe_name,
    image_url,
    cooking_time,
    description,
    difficulty,
    ingredients,
    steps
  } = req.body;

  try {
    // 1. Update main recipe info
    const updateRecipeQuery = `
      UPDATE recipes
      SET recipe_name = $1,
          image_url = $2,
          cooking_time = $3,
          description = $4,
          difficulty = $5
      WHERE recipe_id = $6
      RETURNING *;
    `;
    const recipeResult = await client.query(updateRecipeQuery, [
      recipe_name,
      image_url,
      cooking_time,
      description,
      difficulty,
      recipe_id
    ]);

    if (recipeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // 2. Update ingredients: delete old, insert new
    await client.query(`DELETE FROM RecipeIngredients WHERE recipe_id = $1`, [recipe_id]);

    if (Array.isArray(ingredients)) {
      for (const ing of ingredients) {
        await client.query(`
          INSERT INTO RecipeIngredients (recipe_id, ingredient_id, quantity)
          VALUES ($1, $2, $3)
        `, [recipe_id, ing.ingredient_id, ing.quantity]);
      }
    }

    // 3. Update steps: delete old, insert new
    await client.query(`DELETE FROM recipe_steps WHERE recipe_id = $1`, [recipe_id]);

    if (Array.isArray(steps)) {
      for (const step of steps) {
        await client.query(`
          INSERT INTO recipe_steps (recipe_id, step_number, instruction)
          VALUES ($1, $2, $3)
        `, [recipe_id, step.step_number, step.instruction]);
      }
    }

    res.json({ message: 'Recipe updated successfully' });

  } catch (err) {
    console.error('Error updating recipe:', err);
    res.status(500).send('Server error');
  }
});


// recipe_step
app.post('/recipes/:id/steps', async (req, res) => {
  const recipeId = parseInt(req.params.id);
  const steps = req.body.steps; // คาดว่าเป็น array ของ { step_number, instruction }

  if (!Array.isArray(steps) || steps.length === 0) {
    return res.status(400).json({ error: 'Steps must be a non-empty array' });
  }

  const insertQuery = `
    INSERT INTO recipe_steps (recipe_id, step_number, instruction)
    VALUES ($1, $2, $3)
  `;

  try {
    for (const step of steps) {
      const { step_number, instruction } = step;

      await client.query(insertQuery, [recipeId, step_number, instruction]);
    }

    res.status(201).json({ message: 'Steps added successfully' });
  } catch (err) {
    console.error('Error inserting recipe steps:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/recipes/:id/steps', async (req, res) => {
  const recipeId = parseInt(req.params.id);
  const steps = req.body.steps; // Array ของ step ที่ต้องการอัปเดต

  if (!Array.isArray(steps) || steps.length === 0) {
    return res.status(400).json({ error: 'Steps must be a non-empty array' });
  }

  const updateQuery = `
    UPDATE recipe_steps
    SET instruction = $1
    WHERE recipe_id = $2 AND step_number = $3
  `;

  try {
    for (const step of steps) {
      const { step_number, instruction } = step;

      if (!step_number || !instruction) continue; // ข้ามถ้าไม่มีข้อมูลครบ

      await client.query(updateQuery, [instruction, recipeId, step_number]);
    }

    res.status(200).json({ message: 'Steps updated successfully' });
  } catch (err) {
    console.error('Error updating steps:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.delete('/recipes/:id/steps/:stepNumber', async (req, res) => { 
  const recipeId = parseInt(req.params.id); //id ของ recipes
  const stepNumber = parseInt(req.params.stepNumber); //step ที่ต้องการลบ

  if (isNaN(recipeId) || isNaN(stepNumber)) {
    return res.status(400).json({ error: 'Invalid recipe_id or step_number' });
  }

  try {
    const result = await client.query(
      'DELETE FROM recipe_steps WHERE recipe_id = $1 AND step_number = $2',
      [recipeId, stepNumber]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Step not found' });
    }

    // ปรับ step_number ที่เหลือให้เรียงใหม่ (เช่น step 2 ถูกลบ => step 3 ต้องเปลี่ยนเป็น step 2)
    await client.query(
      `UPDATE recipe_steps
       SET step_number = step_number - 1
       WHERE recipe_id = $1 AND step_number > $2`,
      [recipeId, stepNumber]
    );

    res.status(200).json({ message: 'Step deleted successfully' });
  } catch (err) {
    console.error('Error deleting step:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// ingredients
app.get('/ingredients', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM ingredients ORDER BY ingredient_id');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching ingredients:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/ingredients', async (req, res) => {
  const { name, unit } = req.body;

  if (!name || !unit) {
    return res.status(400).json({ error: 'name and unit are required' });
  }

  try {
    const result = await client.query(
      'INSERT INTO ingredients (name, unit) VALUES ($1, $2) RETURNING *',
      [name, unit]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating ingredient:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/ingredients/:id', async (req, res) => {
  const ingredientId = parseInt(req.params.id);
  const { name, unit } = req.body;

  if (isNaN(ingredientId)) {
    return res.status(400).json({ error: 'Invalid ingredient_id' });
  }

  try {
    const result = await client.query(
      `UPDATE ingredients 
       SET name = COALESCE($1, name), 
           unit = COALESCE($2, unit) 
       WHERE ingredient_id = $3 
       RETURNING *`,
      [name, unit, ingredientId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating ingredient:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/ingredients/:id', async (req, res) => {
  const ingredientId = parseInt(req.params.id);

  if (isNaN(ingredientId)) {
    return res.status(400).json({ error: 'Invalid ingredient_id' });
  }

  try {
    const result = await client.query(
      'DELETE FROM ingredients WHERE ingredient_id = $1 RETURNING *',
      [ingredientId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }

    res.json({ message: 'Ingredient deleted successfully' });
  } catch (err) {
    console.error('Error deleting ingredient:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// recipesingradient
app.get('/recipe-ingredients/:recipe_id', async (req, res) => {
  const recipeId = parseInt(req.params.recipe_id);

  try {
    const result = await client.query(
      `SELECT * FROM RecipeIngredients WHERE recipe_id = $1`,
      [recipeId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching ingredients for recipe:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/recipe-ingredients', async (req, res) => {
  try {
    const result = await client.query(`
      SELECT ri.recipe_ingredient_id, ri.recipe_id, ri.ingredient_id, ri.quantity,
             i.name AS ingredient_name, i.unit
      FROM RecipeIngredients ri
      JOIN ingredients i ON ri.ingredient_id = i.ingredient_id
      ORDER BY ri.recipe_ingredient_id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching recipe ingredients:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/recipe-ingredients', async (req, res) => {
  const { recipe_id, ingredient_id, quantity } = req.body;

  if (!recipe_id || !ingredient_id || quantity == null) {
    return res.status(400).json({ error: 'recipe_id, ingredient_id, and quantity are required' });
  }

  try {
    const result = await client.query(
      `INSERT INTO RecipeIngredients (recipe_id, ingredient_id, quantity)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [recipe_id, ingredient_id, quantity]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting recipe ingredient:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/recipe-ingredients/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { quantity } = req.body;

  if (isNaN(id) || quantity == null) {
    return res.status(400).json({ error: 'Valid recipe_ingredient_id and quantity are required' });
  }

  try {
    const result = await client.query(
      `UPDATE RecipeIngredients
       SET quantity = $1
       WHERE recipe_ingredient_id = $2
       RETURNING *`,
      [quantity, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Recipe ingredient not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating recipe ingredient:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/recipe-ingredients/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid recipe_ingredient_id' });
  }

  try {
    const result = await client.query(
      `DELETE FROM RecipeIngredients
       WHERE recipe_ingredient_id = $1
       RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Recipe ingredient not found' });
    }

    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('Error deleting recipe ingredient:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// RPC handler
const handleRPCRequest = async (msg) => {
  const courseId = msg.content.toString();
  const result = await client.query('SELECT * FROM courses WHERE course_id = $1', [courseId]);
  const response = result.rows.length > 0 ? result.rows[0] : { error: 'Course not found' };

  channel.sendToQueue(
    msg.properties.replyTo,
    Buffer.from(JSON.stringify(response)),
    { correlationId: msg.properties.correlationId }
  );
  channel.ack(msg);
};

// Start consuming RPC requests
const startRPCServer = async () => {
  await connectRabbitMQ();
  channel.consume('recipe_rpc_queue', handleRPCRequest);
  console.log('Recipe Service is waiting for RPC requests...');
};

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', clientProm.register.contentType);
  res.end(await clientProm.register.metrics());
});

startRPCServer();

app.listen(PORT, () => {
  console.log(`recipes Service running on port ${PORT}`);
});