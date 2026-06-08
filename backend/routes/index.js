// backend/src/routes/index.js
import { Router } from 'express';
import adminRoutes from './admin.js';
import officerRoutes from './officer.js';
import complaintsRoutes from './complaints.js';
import {  getPublicSummary} from '../controllers/complaints_ctrl.js';

const router = Router();

router.use('/admin', adminRoutes);
router.use('/officer', officerRoutes);
router.use('/complaints', complaintsRoutes);

// public homepage summary
router.get('/summary',  getPublicSummary); // → /api/summary

export default router;