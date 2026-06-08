// backend/models/Notification.js
import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: String, index: true, required: true }, // Clerk user id (recipient)
    type: { type: String, default: "generic" },            // e.g., complaint_created
    title: { type: String, required: true },
    message: { type: String, default: "" },
    code: { type: String },               // complaint number / ticket / publicToken
    complaintId: { type: String },        // complaint _id
    link: { type: String },               // e.g., /t/<code>
    meta: { type: Object, default: {} },  // complaintType, createdAt, etc.
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", NotificationSchema);