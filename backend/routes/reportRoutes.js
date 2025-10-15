import express from "express";
import {
  getGarageOwnerReport,
  getAdminSystemReport
} from "../controllers/reportController.js";

const router = express.Router();

// Garage owner report - requires authentication middleware to ensure garage owner access
router.get("/garage/:garageId", getGarageOwnerReport);

// Admin system report - requires admin authentication
router.get("/admin/system", getAdminSystemReport);

export default router;