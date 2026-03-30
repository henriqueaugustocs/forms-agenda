import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Load handlers dynamically
const loadHandler = async (path) => {
  const module = await import(path);
  return module.default;
};

// API routes
app.get('/api/available-slots', async (req, res) => {
  const handler = await loadHandler('./api/available-slots.js');
  await handler(req, res);
});

app.post('/api/calendar', async (req, res) => {
  const handler = await loadHandler('./api/calendar.js');
  await handler(req, res);
});

app.post('/api/fbcapi', async (req, res) => {
  const handler = await loadHandler('./api/fbcapi.js');
  await handler(req, res);
});

app.listen(PORT, () => {
  console.log(`✅ API Server running on http://localhost:${PORT}`);
  console.log(`📅 Available slots: http://localhost:${PORT}/api/available-slots?date=2026-02-26`);
});
