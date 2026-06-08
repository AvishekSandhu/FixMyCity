// backend/models/Complaint.js
import mongoose from "mongoose";

const replySchema = new mongoose.Schema(
  {
    senderUserId: String,
    senderRole: String, // 'citizen' | 'officer' | 'admin'
    message: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const historySchema = new mongoose.Schema(
  {
    status: String,
    note: String,
    updatedByUserId: String,
    updatedByRole: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    userId: { type: String, default: null }, // citizen (Clerk) id
    title: { type: String, required: true },
    address: { type: String, required: true },
    complaintType: { type: String, required: true },
    description: { type: String, required: true },
    dateOfProblem: { type: Date, required: true },
    additionalInfo: String,
    name: String,
    phone: String,
    imageUrls: [String],

    status: {
      type: String,
      enum: ["pending", "in_progress", "closed"],
      default: "pending",
    },
    assignedOfficerId: { type: String, default: null }, // Clerk id
    assignedOfficerName: String,
    assignedOfficerEmail: String,
    department: String,

    replies: [replySchema],
    history: [historySchema],
  },
  { timestamps: true }
);

const Complaint = mongoose.model("Complaint", complaintSchema);
export default Complaint;