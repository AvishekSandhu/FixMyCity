// backend/server.js

import "dotenv/config";
import express from "express";
import cors from "cors";
import { ClerkExpressWithAuth, clerkClient } from "@clerk/clerk-sdk-node";

const app = express();
const PORT = process.env.PORT || 3001;

if (!process.env.CLERK_SECRET_KEY) {
  throw new Error("Missing CLERK_SECRET_KEY in .env");
}

app.use(
  cors({
    origin: "http://localhost:5173", // Vite dev URL
    credentials: true,
  })
);

app.use(express.json());

// Attach auth info to req.auth (may be null if unauthenticated)
app.use(ClerkExpressWithAuth());

/**
 * GET /api/admin/users
 * Only admin users (role === "admin") can access.
 */
app.get("/api/admin/users", async (req, res) => {
  try {
    const { userId } = req.auth || {};

    if (!userId) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    // Get the current user to check their role
    const currentUser = await clerkClient.users.getUser(userId);
    const role = currentUser.publicMetadata.role || "citizen";

    if (role !== "admin") {
      return res.status(403).json({ error: "Forbidden: admin only" });
    }

    // In this SDK version, getUserList returns an array directly
    const users = await clerkClient.users.getUserList({
      limit: 100,
    });

    const mapped = users.map((u) => ({
      id: u.id,
      email:
        u.emailAddresses && u.emailAddresses[0]
          ? u.emailAddresses[0].emailAddress
          : null,
      role: u.publicMetadata.role || "citizen",
      createdAt: u.createdAt,
      lastSignInAt: u.lastSignInAt,
    }));

    return res.json(mapped);
  } catch (err) {
    console.error("Error in /api/admin/users:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});