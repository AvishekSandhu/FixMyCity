import { Router } from "express";
import {
  getPublicSummary,
  getPublicComplaints,
  getPublicComplaintByCode,
} from "../controllers/complaints_ctrl.js";

const router = Router();

// Public endpoints (NO requireAuth)
router.get("/summary", getPublicSummary);
router.get("/complaints", getPublicComplaints);
router.get("/complaints/:code", getPublicComplaintByCode);

export default router; 