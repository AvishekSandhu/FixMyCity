// backend/src/controllers/officer.controller.js
import Complaint from '../models/complaints.js';

export async function getOfficerComplaints(req, res, next) {
  try {
    const { status = 'all' } = req.query;
    const filter = {
      assignedOfficerId: req.userId,
      ...(status === 'all' ? {} : { status }),
    };

    const complaints = await Complaint.find(filter).sort({ createdAt: -1 });
    return res.json(complaints);
  } catch (err) {
    console.error('Error in getOfficerComplaints:', err);
    next(err);
  }
}