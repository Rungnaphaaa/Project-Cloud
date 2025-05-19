const express = require('express');
const { Client } = require('pg');
const amqp = require('amqplib');

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

const PORT = 5003;

// PostgreSQL connection
const client = new Client({
  user: 'postgres',
  host: 'rating-db',
  database: 'rating_db',
  password: 'password',
  port: 5432,
});

client.connect();

// RabbitMQ connection (optional for RPC)
let channel;
const connectRabbitMQ = async () => {
  const connection = await amqp.connect('amqp://guest:guest@rabbitmq');
  channel = await connection.createChannel();
  await channel.assertQueue('rating_rpc_queue');
};

// CRUD Operations

// Create a new rating
app.post('/ratings', async (req, res) => {
  const { userId, recipeId, score, comment } = req.body;
  try {
    await client.query(
      'INSERT INTO ratings ( user_id, recipe_id, score, comment) VALUES ($1, $2, $3, $4)',
      [ userId, recipeId, score, comment]
    );
    res.status(201).json({ message: 'Rating created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all ratings
app.get('/ratings', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM ratings');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a specific rating
// app.get('/ratings/:ratingId', async (req, res) => {
//   const { ratingId } = req.params;
//   try {
//     const result = await client.query('SELECT * FROM ratings WHERE rating_id = $1', [ratingId]);
//     if (result.rows.length > 0) {
//       res.json(result.rows[0]);
//     } else {
//       res.status(404).json({ error: 'Rating not found' });
//     }
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// Update a rating
app.put('/ratings/:ratingId', async (req, res) => {
  const { ratingId } = req.params;
  const { score, comment } = req.body;
  try {
    await client.query(
      'UPDATE ratings SET score = $1, comment = $2 WHERE rating_id = $3',
      [score, comment, ratingId]
    );
    res.json({ message: 'Rating updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a rating
app.delete('/ratings/:ratingId', async (req, res) => {
  const { ratingId } = req.params;
  try {
    await client.query('DELETE FROM ratings WHERE rating_id = $1', [ratingId]);
    res.json({ message: 'Rating deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/ratings/:recipeId", async (req, res) => {
  const { recipeId } = req.params;
  try {
    const result = await client.query(
      "SELECT * FROM ratings WHERE recipe_id = $1",
      [recipeId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RPC handler (optional - if other services need to request a rating via RPC)
const handleRPCRequest = async (msg) => {
  const ratingId = msg.content.toString();
  const result = await client.query('SELECT * FROM ratings WHERE rating_id = $1', [ratingId]);
  const response = result.rows.length > 0 ? result.rows[0] : { error: 'Rating not found' };

  channel.sendToQueue(
    msg.properties.replyTo,
    Buffer.from(JSON.stringify(response)),
    { correlationId: msg.properties.correlationId }
  );
  channel.ack(msg);
};

// Start consuming RPC requests (optional)
const startRPCServer = async () => {
  await connectRabbitMQ();
  channel.consume('rating_rpc_queue', handleRPCRequest);
  console.log('Rating Service is waiting for RPC requests...');
};

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', clientProm.register.contentType);
  res.end(await clientProm.register.metrics());
});

startRPCServer();

app.listen(PORT, () => {
  console.log(`Rating Service running on port ${PORT}`);
});
