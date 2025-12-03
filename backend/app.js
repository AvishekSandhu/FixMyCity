// backend/app.js
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { ClerkExpressWithAuth } from './config/clerk.js';
import { uploadDir } from './config/multer.config.js';
import { errorHandler } from './middleware/error.js';

const app = express();

const allowedOrigins = [
  'http://localhost:5173',                   // Vite dev
  'https://fixmycity-1-5wbk.onrender.com',  // Render frontend
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

// serve uploaded files
app.use('/uploads', express.static(uploadDir));

// Clerk middleware → sets req.auth
app.use(ClerkExpressWithAuth());

// all API routes under /api
app.use('/api', routes);

// global error handler
app.use(errorHandler);

export default app;
