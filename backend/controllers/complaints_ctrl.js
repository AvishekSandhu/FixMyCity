// backend/controllers/complaints_ctrl.js
import mongoose from "mongoose";
import Complaint from "../models/complaints.js"; 
import { clerkClient } from "../config/clerk.js";
import { getUserRole, isAdminRole } from "../role.js";
import { notifyComplaintCreated } from "../middleware/notify.js";



// ------------------------------------------------------
// HELPERS
// ------------------------------------------------------

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Ticket generation by role
const generateTicketByRole = (role) => {
  let prefix = "CZ"; 

  if (role === "officer") prefix = "OF";
  else if (role === "admin") prefix = "AD";

  const number = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${number}`;
};

// ------------------------------------------------------
// PUBLIC ENDPOINTS
// ------------------------------------------------------

export async function getPublicSummary(req, res, next) {
  try {
    const [pending, closed, total] = await Promise.all([
      Complaint.countDocuments({ status: "pending" }),
      Complaint.countDocuments({ status: "closed" }),
      Complaint.countDocuments({}),
    ]);

    const limit = Math.max(1, Math.min(20, parseInt(req.query.limit || "10")));

    const recentComplaints = await Complaint.find(
      {},
      "title description complaintType address status createdAt ticket"
    )
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.json({
      counts: { pending, closed, total },
      recentComplaints,
    });
  } catch (err) {
    console.error("Error in getPublicSummary:", err);
    next(err);
  }
}

export async function getPublicComplaintByCode(req, res, next) {
  try {
    const code = (req.params.code || "").trim();

    const orQuery = [
      { ticket: code },
      { complaintNumber: code },
      { publicToken: code },
    ];
    if (isValidObjectId(code)) orQuery.push({ _id: code });

    const complaint = await Complaint.findOne({ $or: orQuery })
      .select(
        "ticket complaintNumber publicToken title description complaintType address status createdAt updatedAt location imageUrls history name assignedOfficerId assignedOfficerName"
      )
      .lean();

    if (!complaint) return res.status(404).json({ error: "Complaint not found" });

    return res.json({
      complaint: {
        ...complaint,
        statusHistory: complaint.history || [],
      },
    });
  } catch (err) {
    console.error("Error in getPublicComplaintByCode:", err);
    next(err);
  }
}

export async function getPublicComplaints(req, res, next) {
  try {
    const limit = Math.max(1, Math.min(500, parseInt(req.query.limit || "100")));

    // Only show unresolved by default (good for public map)
    const statuses = (req.query.status || "pending,in_progress")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const complaints = await Complaint.find(
      { status: { $in: statuses } },
      "title complaintType status address createdAt ticket location"
    )
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({ complaints });
  } catch (err) {
    console.error("Error in getPublicComplaints:", err);
    next(err);
  }
}

// ------------------------------------------------------
// PROTECTED ENDPOINTS
// ------------------------------------------------------

export async function createComplaint(req, res) {
  try {
    const userId = req.auth?.userId || req.userId;
    const role = await getUserRole(userId);

    const {
      title,
      address,
      complaintType,
      description,
      dateOfProblem,
      additionalInfo,
      name,
      phone,
      lat,
      lng,
    } = req.body;

    if (!title || !address || !complaintType || !description || !dateOfProblem) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const imageUrls =
      req.files?.map?.((file) => `/uploads/${file.filename}`) || [];

    const ticket = generateTicketByRole(role);

    const location =
      lat && lng ? { lat: Number(lat), lng: Number(lng), address } : {};

    const complaint = await Complaint.create({
      userId,
      ticket,
      title,
      address,
      location,
      complaintType,
      description,
      dateOfProblem: new Date(dateOfProblem),
      additionalInfo,
      name,
      phone,
      imageUrls,
      status: "pending",
      history: [
        {
          status: "pending",
          note: "Complaint created",
          updatedByUserId: userId,
          updatedByRole: role,
        },
      ],
    });

    // Send exactly ONE user notification + ONE admin notification
    await notifyComplaintCreated({ submitterId: userId, complaint });

    return res.status(201).json({ message: "Complaint created", complaint });
  } catch (err) {
    console.error("Error in createComplaint:", err);
    return res.status(500).json({ error: "Failed to submit complaint" });
  }
}

export async function getMyComplaints(req, res, next) {
  try {
    const userId = req.auth?.userId || req.userId;

    const complaints = await Complaint.find({ userId }).sort({
      createdAt: -1,
    });

    return res.json(complaints);
  } catch (err) {
    console.error("Error in getMyComplaints:", err);
    next(err);
  }
}

export async function getComplaintById(req, res, next) {
  try {
    const userId = req.auth?.userId || req.userId;
    const role = await getUserRole(userId);

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ error: "Not found" });

    const isOwner = complaint.userId === userId;
    const isAssignedOfficer = complaint.assignedOfficerId === userId;

    if (!isOwner && !isAssignedOfficer && !isAdminRole(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return res.json(complaint);
  } catch (err) {
    console.error("Error in getComplaintById:", err);
    next(err);
  }
}

export async function updateComplaintStatus(req, res, next) {
  try {
    const userId = req.auth?.userId || req.userId;
    const role = req.userRole || (await getUserRole(userId));

    const { status, note, assignToSelf } = req.body;
    const allowed = ["pending", "in_progress", "closed"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ error: "Not found" });

    if (assignToSelf && role === "officer") {
      const clerkUser = await clerkClient.users.getUser(userId);

      complaint.assignedOfficerId = userId;
      complaint.assignedOfficerName = clerkUser.fullName || "Officer";
      complaint.assignedOfficerEmail =
        clerkUser.emailAddresses?.[0]?.emailAddress || null;
    }

    complaint.status = status;
    complaint.history.push({
      status,
      note: note || "",
      updatedByUserId: userId,
      updatedByRole: role,
    });

    await complaint.save();
    return res.json({ message: "Status updated", complaint });
  } catch (err) {
    console.error("Error in updateComplaintStatus:", err);
    next(err);
  }
}

export async function addComplaintReply(req, res, next) {
  try {
    const userId = req.auth?.userId || req.userId;
    const role = await getUserRole(userId);

    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ error: "Not found" });

    const isOwner = complaint.userId === userId;
    const isAssignedOfficer = complaint.assignedOfficerId === userId;

    if (!isOwner && !isAssignedOfficer && !isAdminRole(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    complaint.replies.push({
      senderUserId: userId,
      senderRole: role,
      message,
    });

    await complaint.save();
    return res.json({ message: "Reply added", complaint });
  } catch (err) {
    console.error("Error in addComplaintReply:", err);
    next(err);
  }
}
