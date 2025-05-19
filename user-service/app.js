const express = require('express');
const { Client } = require('pg');
const amqp = require('amqplib');
const multer = require('multer');
const path = require('path');

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

app.use((req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.route?.path || req.path, code: res.statusCode });
  });
  next();
});

const PORT = 5001;

// PostgreSQL connection
const client = new Client({
  user: 'postgres',
  host: 'user-db',
  database: 'user_db',
  password: 'password',
  port: 5432,
});

const connectDB = async () => {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
  } catch (err) {
    console.error('Failed to connect to PostgreSQL', err);
    process.exit(1);
  }
};

// RabbitMQ connection for RPC
let channel;
const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect('amqp://guest:guest@rabbitmq');
    channel = await connection.createChannel();
    await channel.assertQueue('user_rpc_queue');
    console.log('Connected to RabbitMQ');
  } catch (err) {
    console.error('Failed to connect to RabbitMQ', err);
    process.exit(1);
  }
};

// ให้เสิร์ฟไฟล์ใน /profile_image ผ่าน URL /uploads/
app.use('/profile_image', express.static(path.join(__dirname, 'profile_image')));

// GET all users (excluding password)
app.get('/users', async (req, res) => {
  try {
    const result = await client.query(
      `SELECT 
         u.user_id,
         u.name,
         u.email,
         u.bio,
         u.profile_image_url,
         u.recipe_count,
         u.favorite_count,
         u.join_date,
         u.role_id,
         r.role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET a user by ID (excluding password)
app.get('/users/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await client.query(
      `SELECT 
         u.user_id,
         u.name,
         u.email,
         u.bio,
         u.profile_image_url,
         u.recipe_count,
         u.favorite_count,
         u.join_date,
         u.role_id,
         r.role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create user
app.post('/users', async (req, res) => {
  const {
    name, email, password, bio, profile_image_url,
    recipe_count = 0, favorite_count = 0,
    join_date = new Date(), role_id
  } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await client.query(
      `INSERT INTO users 
        (name, email, password, bio, profile_image_url, recipe_count, favorite_count, join_date, role_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [name, email, password, bio, profile_image_url, recipe_count, favorite_count, join_date, role_id]
    );
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update user partially
app.patch('/users/:userId', async (req, res) => {
  const { userId } = req.params;
  const updates = req.body;

  // เช็คว่า body มีข้อมูลจะอัปเดตจริงไหม
  if (!updates || Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields provided for update' });
  }

  // สร้าง SET clause และ value list แบบ dynamic
  const fields = [];
  const values = [];

  let index = 1;

  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = $${index}`);
    values.push(value);
    index++;
  }

  values.push(userId); // $index สำหรับ WHERE user_id = ...

  const query = `UPDATE users SET ${fields.join(', ')} WHERE user_id = $${index}`;

  try {
    const result = await client.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// DELETE user
app.delete('/users/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await client.query('DELETE FROM users WHERE user_id = $1', [userId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await client.query(
      `SELECT u.user_id, u.name, u.email, u.password, u.role_id, r.role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // ไม่ใช้ JWT ก็ส่งข้อมูลผู้ใช้กลับได้ (หรือจะใช้ session ก็ได้)
    const { password: _, ...userData } = user; // ลบ password ออกจาก response
    res.json({ message: 'Login successful', user: userData });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Storage engine สำหรับ multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'profile_image/'); // โฟลเดอร์ที่เก็บรูป
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `user_${req.params.userId}_${Date.now()}${ext}`;
    cb(null, uniqueName);
  }
});

// ตัวกรองไฟล์ (แค่รูป)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG and PNG images are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 5 MB
  },
});

// POST /users/:userId/upload-profile-image
app.post('/users/:userId/upload-profile-image', upload.single('profile_image'), async (req, res) => {
  const { userId } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }

  const imageUrl = `http://localhost:${PORT}/profile_image/${req.file.filename}`;

  try {
    const result = await client.query(
      `UPDATE users SET profile_image_url = $1 WHERE user_id = $2`,
      [imageUrl, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Profile image uploaded successfully', imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// RPC Handler
const handleRPCRequest = async (msg) => {
  try {
    const userId = msg.content.toString();
    const result = await client.query(
      `SELECT u.*, r.role_name 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.role_id 
       WHERE u.user_id = $1`,
      [userId]
    );
    const response = result.rows.length > 0 ? result.rows[0] : { error: 'User not found' };

    channel.sendToQueue(
      msg.properties.replyTo,
      Buffer.from(JSON.stringify(response)),
      { correlationId: msg.properties.correlationId }
    );
    channel.ack(msg);
  } catch (err) {
    console.error('RPC Handling Error:', err);
  }
};

const startRPCServer = async () => {
  await connectRabbitMQ();
  channel.consume('user_rpc_queue', handleRPCRequest);
  console.log('User Service is waiting for RPC requests...');
};

// Graceful Shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  if (client) await client.end();
  if (channel) await channel.close();
  process.exit(0);
});

// Start the server
const startServer = async () => {
  await connectDB();
  await startRPCServer();

  app.listen(PORT, () => {
    console.log(`User Service running on port ${PORT}`);
  });
};

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', clientProm.register.contentType);
  res.end(await clientProm.register.metrics());
});

startServer();
