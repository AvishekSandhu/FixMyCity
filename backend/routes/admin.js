// backend/src/routes/admin.routes.js
import { Router } from 'express';
import {
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAdminDashboardSummary,
  getAdminComplaints,
  assignOfficerToComplaint,
  updateComplaintDetails,
  deleteComplaint,
} from '../contollers/admin_ctrl.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/role.middleware.js';

const router = Router();

router.get('/users', requireAuth, requireAdmin, getAllUsers);
router.patch('/users/:id/role', requireAuth, requireAdmin, updateUserRole);
router.delete('/users/:id', requireAuth, requireAdmin, deleteUser);

router.get(
  '/dashboard-summary',
  requireAuth,
  requireAdmin,
  getAdminDashboardSummary
);

router.get('/complaints', requireAuth, requireAdmin, getAdminComplaints);
router.patch(
  '/complaints/:id/assign-officer',
  requireAuth,
  requireAdmin,
  assignOfficerToComplaint
);
router.patch(
  '/complaints/:id',
  requireAuth,
  requireAdmin,
  updateComplaintDetails
);
router.delete(
  '/complaints/:id',
  requireAuth,
  requireAdmin,
  deleteComplaint
);

export default router;