import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import ccdMetricsRouter from './routes/ccdMetrics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Mount secure backend API routes first
app.use(ccdMetricsRouter);

// Serve static files from Vite build output
app.use(express.static(path.join(__dirname, '../dist')));

// SPA Fallback route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
