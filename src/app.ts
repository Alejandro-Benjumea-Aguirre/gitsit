import express from 'express';

const app = express();

// Middlewares globales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_, res) => {
  res.status(200).json({ status: 'OK' });
});

export default app;
