// backend/src/controllers/complaints.controller.js
import Complaint from '../models/complaints.js';
import { clerkClient } from '../config/clerk.js';
import { getUserRole, isAdminRole } from '../role.js';

export async function getPublicSummary(req, res, next) {
  try {
    const [pending, closed, total, recentComplaints] = await Promise.all([
      Complaint.countDocuments({ status: 'pending' }),
      Complaint.countDocuments({ status: 'closed' }),
      Complaint.countDocuments({}),
      Complaint.find().sort({ createdAt: -1 }).limit(4),
    ]);

    return res.json({
      counts: { pending, closed, total },
      recentComplaints,
    });
  } catch (err) {
    console.error('Error in getPublicSummary:', err);
    next(err);
  }
}

export async function createComplaint(req, res, next) {
  try {
    const userId = req.userId;

    const {
      title,
      address,
      complaintType,
      description,
      dateOfProblem,
      additionalInfo,
      name,
      phone,
    } = req.body;

    if (!title || !address || !complaintType || !description || !dateOfProblem) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const imageUrls = (req.files || []).map(
      (file) => `/uploads/${file.filename}`
    );

    const complaint = await Complaint.create({
      userId,
      title,
      address,
      complaintType,
      description,
      dateOfProblem: new Date(dateOfProblem),
      additionalInfo,
      name,
      phone,
      imageUrls,
      status: 'pending',
      history: [
        {
          status: 'pending',
          note: 'Complaint created',
          updatedByUserId: userId,
          updatedByRole: 'citizen',
        },
      ],
    });

    return res.status(201).json({ message: 'Complaint created', complaint });
  } catch (err) {
    console.error('Error in createComplaint:', err);
    next(err);
  }
}

export async function getMyComplaints(req, res, next) {
  try {
    const userId = req.userId;
    const complaints = await Complaint.find({ userId }).sort({
      createdAt: -1,
    });

    return res.json(complaints);
  } catch (err) {
    console.error('Error in getMyComplaints:', err);
    next(err);
  }
}

export async function getComplaintById(req, res, next) {
  try {
    const userId = req.userId;
    const role = await getUserRole(userId);
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) return res.status(404).json({ error: 'Not found' });

    const isOwner = complaint.userId === userId;
    const isAssignedOfficer = complaint.assignedOfficerId === userId;

    if (!isOwner && !isAssignedOfficer && !isAdminRole(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return res.json(complaint);
  } catch (err) {
    console.error('Error in getComplaintById:', err);
    next(err);
  }
}

export async function updateComplaintStatus(req, res, next) {
  try {
    const userId = req.userId;
    const role = req.userRole; // 'admin' or 'officer'

    const { status, note, assignToSelf } = req.body;
    const allowed = ['pending', 'in_progress', 'closed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Not found' });

    if (assignToSelf && role === 'officer') {
      const clerkUser = await clerkClient.users.getUser(userId);
      const email =
        clerkUser.emailAddresses && clerkUser.emailAddresses[0]
          ? clerkUser.emailAddresses[0].emailAddress
          : null;

      complaint.assignedOfficerId = userId;
      complaint.assignedOfficerName = clerkUser.fullName || 'Officer';
      complaint.assignedOfficerEmail = email;
    }

    complaint.status = status;
    complaint.history.push({
      status,
      note: note || '',
      updatedByUserId: userId,
      updatedByRole: role,
    });

    await complaint.save();
    return res.json({ message: 'Status updated', complaint });
  } catch (err) {
    console.error('Error in updateComplaintStatus:', err);
    next(err);
  }
}

export async function addComplaintReply(req, res, next) {
  try {
    const userId = req.userId;
    const role = await getUserRole(userId);
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Not found' });

    const isOwner = complaint.userId === userId;
    const isAssignedOfficer = complaint.assignedOfficerId === userId;

    if (!isOwner && !isAssignedOfficer && !isAdminRole(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    complaint.replies.push({
      senderUserId: userId,
      senderRole: role,
      message,
    });

    await complaint.save();
    return res.json({ message: 'Reply added', complaint });
  } catch (err) {
    console.error('Error in addComplaintReply:', err);
    next(err);
  }
}