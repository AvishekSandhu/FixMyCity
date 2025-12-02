// backend/src/app.js
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { ClerkExpressWithAuth } from './config/clerk.js';
import { uploadDir } from './config/multer.config.js';
import { errorHandler } from './middleware/error.js';
// console.log('Serving uploads from:', uploadDir);    

const app = express();

app.use(
  cors({
    origin: 'http://localhost:5173', // React dev URL
    credentials: true,
  })
);

app.use(express.json());

// serve uploaded files
app.use('/uploads', express.static(uploadDir));

// Clerk middleware → sets req.auth
app.use(ClerkExpressWithAuth());

// mount all API routes under /api
app.use('/api', routes);

// global error handler (last)
app.use(errorHandler);

export default app;