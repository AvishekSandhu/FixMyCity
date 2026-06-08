  // backend/src/routes/complaints.routes.js
  import { Router } from 'express';
  import {
    createComplaint,
    getMyComplaints,
    getComplaintById,
    updateComplaintStatus,
    addComplaintReply,
  } from '../controllers/complaints_ctrl.js';
  import { requireAuth } from '../middleware/auth.js';
  import { requireOfficerOrAdmin } from '../middleware/role.middleware.js';
  import { uploadComplaintImages } from '../middleware/upload.js';

  const router = Router();

  router.post('/', requireAuth, uploadComplaintImages, createComplaint);
  router.get('/my', requireAuth, getMyComplaints);
  router.get('/:id', requireAuth, getComplaintById);
  router.patch(
    '/:id/status',
    requireAuth,
    requireOfficerOrAdmin,
    updateComplaintStatus
  );
  router.post('/:id/replies', requireAuth, addComplaintReply);

  export default router;