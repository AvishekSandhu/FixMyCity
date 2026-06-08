// backend/app.js
import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { ClerkExpressWithAuth } from "./config/clerk.js";
import { uploadDir } from "./config/multer.config.js";
import { errorHandler } from "./middleware/error.js";

import publicRoutes from "./routes/public.r.js";
import notificationsRouter from "./routes/notification.js";
import complaintsRouter from "./routes/complaints.js";

const app = express();

app.use(
  cors({
    origin: [
      "https://fixmycity-qi5p.onrender.com",
      "http://localhost:5174",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static(uploadDir));



app.use(ClerkExpressWithAuth());

app.use("/api", routes);

app.use("/api", notificationsRouter);

app.use("/api/public", publicRoutes);
// ✅ FIXED mount (your protected complaints routes)
app.use('/api/complaints', complaintsRouter);

app.use(errorHandler);

export default app;