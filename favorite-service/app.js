const express = require("express");
const { Client } = require("pg");
const amqp = require("amqplib");

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

const PORT = 5004;

// PostgreSQL connection
const client = new Client({
  user: "postgres",
  host: "favorite-db", // ชื่อ container ของ database ใน docker-compose
  database: "favorite_db",
  password: "password",
  port: 5432,
});

client.connect();

// RabbitMQ connection (ไม่จำเป็นถ้ายังไม่ใช้ RPC, สามารถปิดไว้ได้)
let channel;
const connectRabbitMQ = async () => {
  const connection = await amqp.connect("amqp://guest:guest@rabbitmq");
  channel = await connection.createChannel();
  await channel.assertQueue("favorite_rpc_queue");
};

// CRUD Operations

// Add a favorite
app.post("/favorites", async (req, res) => {
  const { userId, recipeId } = req.body;
  try {
    await client.query(
      "INSERT INTO favorites (user_id, recipe_id) VALUES ($1, $2)",
      [userId, recipeId]
    );
    res.status(201).json({ message: "Favorite added successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all favorites for a user
app.get("/favorites/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await client.query(
      "SELECT * FROM favorites WHERE user_id = $1",
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a favorite
app.delete("/favorites", async (req, res) => {
  const { userId, recipeId } = req.body;
  try {
    await client.query(
      "DELETE FROM favorites WHERE user_id = $1 AND recipe_id = $2",
      [userId, recipeId]
    );
    res.json({ message: "Favorite removed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// (Optional) RPC handler
const handleRPCRequest = async (msg) => {
  const userId = msg.content.toString();
  const result = await client.query(
    "SELECT * FROM favorites WHERE user_id = $1",
    [userId]
  );
  const response = result.rows;

  channel.sendToQueue(
    msg.properties.replyTo,
    Buffer.from(JSON.stringify(response)),
    { correlationId: msg.properties.correlationId }
  );
  channel.ack(msg);
};

// Start RPC server if needed
const startRPCServer = async () => {
  await connectRabbitMQ();
  channel.consume("favorite_rpc_queue", handleRPCRequest);
  console.log("Favorite Service is waiting for RPC requests...");
};

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', clientProm.register.contentType);
  res.end(await clientProm.register.metrics());
});

startRPCServer();

app.listen(PORT, () => {
  console.log(`Favorite Service running on port ${PORT}`);
});
