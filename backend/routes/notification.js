// backend/src/routes/notifications.js
import express from "express";
import Notification from "../models/notification.js";

// If using Clerk: req.auth.userId is set by your Clerk middleware
const getUserId = (req) => req?.auth?.userId || req?.user?.id;

const router = express.Router();

// GET /api/me/notifications?limit=20
router.get("/me/notifications", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || "20", 10)));
    const items = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to fetch notifications" });
  }
});

// POST /api/me/notifications/read-all
router.post("/me/notifications/read-all", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to mark read" });
  }
});

// // OPTIONAL: POST /api/me/notifications (client-created notifications)
// router.post("/me/notifications", async (req, res) => {
//   try {
//     const userId = getUserId(req);
//     if (!userId) return res.status(401).json({ error: "Unauthorized" });

//     const { type, title, message, code, complaintId, link, meta } = req.body || {};
//     const doc = await Notification.create({
//       userId,
//       type: type || "generic",
//       title: title || "Update",
//       message: message || "",
//       code,
//       complaintId,
//       link,
//       meta: meta || {},
//     });
//     res.json({ ok: true, notification: doc });
//   } catch (e) {
//     res.status(500).json({ error: e.message || "Failed to create notification" });
//   }
// });

export default router;