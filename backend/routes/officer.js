// backend/src/routes/officer.routes.js
import { Router } from 'express';
import { getOfficerComplaints } from '../contollers/officer_ctrl.js';
import { requireAuth } from '../middleware/auth.js';
import { requireOfficerOrAdmin } from '../middleware/role.middleware.js';

const router = Router();

router.get(
  '/complaints',
  requireAuth,
  requireOfficerOrAdmin,
  getOfficerComplaints
);

export default router;