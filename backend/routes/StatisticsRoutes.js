import express from "express";
import {
  fetchCountNewRequests,
  fetchCountActiveJobs,
  calculateAcceptanceRate,
  getSentSuccessNotifications,
  getGarageAcceptedNotifications,
  getServiceCompletedNotifications,
  updateNotificationStatus,
} from "../controllers/StatisticsController.js";

const router = express.Router();
router.get("/:garageId/count/new-requests", fetchCountNewRequests);

// ✅ Route 2: Count of active jobs (GARAGE_ACCEPTED)
router.get("/:garageId/count/active-jobs", fetchCountActiveJobs);
router.get("/:garageId/acceptance-rate", calculateAcceptanceRate);
// Fetch notifications from last 24 hours by garageId
router.get("/:garageId/sent-success", getSentSuccessNotifications);
router.get("/:garageId/garage-accepted", getGarageAcceptedNotifications);
router.get("/:garageId/service-completed", getServiceCompletedNotifications);
router.put("/:id/status", updateNotificationStatus);

export default router;
