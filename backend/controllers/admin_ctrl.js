// backend/src/controllers/admin.controller.js
import { clerkClient } from '../config/clerk.js';
import Complaint from '../models/complaints.js';

export async function getAllUsers(req, res, next) {
  try {
    const users = await clerkClient.users.getUserList({ limit: 100 });

    const mapped = users.map((u) => {
      const email =
        u.emailAddresses && u.emailAddresses[0]
          ? u.emailAddresses[0].emailAddress
          : null;

      const username = u.username || null;
      const fullName =
        u.fullName ||
        [u.firstName, u.lastName].filter(Boolean).join(' ') ||
        null;

      return {
        id: u.id,
        email,
        username,
        fullName,
        role: u.publicMetadata.role || 'citizen',
        createdAt: u.createdAt,
        lastSignInAt: u.lastSignInAt,
      };
    });

    res.json(mapped);
  } catch (err) {
    console.error('Error in getAllUsers:', err);
    next(err);
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const { role } = req.body;
    const allowedRoles = ['admin', 'officer', 'citizen'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const targetUserId = req.params.id;

    const updated = await clerkClient.users.updateUser(targetUserId, {
      publicMetadata: { role },
    });

    const email =
      updated.emailAddresses && updated.emailAddresses[0]
        ? updated.emailAddresses[0].emailAddress
        : null;

    const username = updated.username || null;
    const fullName =
      updated.fullName ||
      [updated.firstName, updated.lastName].filter(Boolean).join(' ') ||
      null;

    return res.json({
      id: updated.id,
      email,
      username,
      fullName,
      role: updated.publicMetadata.role || 'citizen',
      createdAt: updated.createdAt,
      lastSignInAt: updated.lastSignInAt,
    });
  } catch (err) {
    console.error('Error in updateUserRole:', err);
    next(err);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const currentAdminId = req.userId;
    const targetUserId = req.params.id;

    if (targetUserId === currentAdminId) {
      return res
        .status(400)
        .json({ error: 'You cannot delete your own admin account' });
    }

    await clerkClient.users.deleteUser(targetUserId);

    return res.json({ message: 'User deleted', id: targetUserId });
  } catch (err) {
    console.error('Error in deleteUser:', err);
    next(err);
  }
}

export async function getAdminDashboardSummary(req, res, next) {
  try {
    const [pending, closed, total, recentComplaints] = await Promise.all([
      Complaint.countDocuments({ status: 'pending' }),
      Complaint.countDocuments({ status: 'closed' }),
      Complaint.countDocuments({}),
      Complaint.find().sort({ createdAt: -1 }).limit(5),
    ]);

    return res.json({
      counts: { pending, closed, total },
      recentComplaints,
    });
  } catch (err) {
    console.error('Error in getAdminDashboardSummary:', err);
    next(err);
  }
}

export async function getAdminComplaints(req, res, next) {
  try {
    const { status = 'all' } = req.query;
    const filter = status === 'all' ? {} : { status };

    const complaints = await Complaint.find(filter).sort({ createdAt: -1 });
    return res.json(complaints);
  } catch (err) {
    console.error('Error in getAdminComplaints:', err);
    next(err);
  }
}

export async function assignOfficerToComplaint(req, res, next) {
  try {
    const adminUserId = req.userId;
    const adminRole = req.userRole;

    const { officerId } = req.body;
    if (!officerId) {
      return res.status(400).json({ error: 'officerId is required' });
    }

    const officerUser = await clerkClient.users.getUser(officerId);
    const officerRole = officerUser.publicMetadata.role || 'citizen';
    if (officerRole !== 'officer') {
      return res.status(400).json({ error: 'Target user is not an officer' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Not found' });

    const email =
      officerUser.emailAddresses && officerUser.emailAddresses[0]
        ? officerUser.emailAddresses[0].emailAddress
        : null;

    complaint.assignedOfficerId = officerId;
    complaint.assignedOfficerName = officerUser.fullName || 'Officer';
    complaint.assignedOfficerEmail = email;

    complaint.history.push({
      status: complaint.status,
      note: `Assigned to officer ${complaint.assignedOfficerName}`,
      updatedByUserId: adminUserId,
      updatedByRole: adminRole,
    });

    await complaint.save();
    return res.json({ message: 'Officer assigned', complaint });
  } catch (err) {
    console.error('Error in assignOfficerToComplaint:', err);
    next(err);
  }
}

export async function updateComplaintDetails(req, res, next) {
  try {
    const adminUserId = req.userId;
    const adminRole = req.userRole;

    const {
      title,
      address,
      complaintType,
      description,
      dateOfProblem,
      additionalInfo,
      department,
    } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Not found' });

    if (title !== undefined) complaint.title = title;
    if (address !== undefined) complaint.address = address;
    if (complaintType !== undefined) complaint.complaintType = complaintType;
    if (description !== undefined) complaint.description = description;
    if (dateOfProblem !== undefined)
      complaint.dateOfProblem = new Date(dateOfProblem);
    if (additionalInfo !== undefined)
      complaint.additionalInfo = additionalInfo;
    if (department !== undefined) complaint.department = department;

    complaint.history.push({
      status: complaint.status,
      note: 'Complaint details updated by admin',
      updatedByUserId: adminUserId,
      updatedByRole: adminRole,
    });

    await complaint.save();
    return res.json({ message: 'Complaint updated', complaint });
  } catch (err) {
    console.error('Error in updateComplaintDetails:', err);
    next(err);
  }
}

export async function deleteComplaint(req, res, next) {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Not found' });

    await Complaint.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Complaint deleted', id: req.params.id });
  } catch (err) {
    console.error('Error in deleteComplaint:', err);
    next(err);
  }
}