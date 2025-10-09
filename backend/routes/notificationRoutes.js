import express from "express";

import {
  findAllNotifications,
  findNotificationById,
  updateNotificationStatus,
  deleteNotification,
  deleteAllNotifications,
  findAllNotificationsByGarageId,
  deleteAllNotificationsByGarageId,
  // --- NEW IMPORTS ---
  // acceptRequest,
  // declineRequest,
  // completeService,
} from "../controllers/notificationController.js"; // Adjust path as necessary

const router = express.Router();

// =========================================================================
// R - READ (GLOBAL & BY ID)
// =========================================================================
// GET /api/notifications
router.get("/", findAllNotifications);

// GET /api/notifications/:id
router.get("/:id", findNotificationById);

// =========================================================================
// R/D - READ & DELETE (GARAGE-SPECIFIC)
// =========================================================================
// GET /api/notifications/garage/:garageId
router.get("/garage/:garageId", findAllNotificationsByGarageId);

// DELETE /api/notifications/garage/:garageId
router.delete("/garage/:garageId", deleteAllNotificationsByGarageId);

// =========================================================================
// U - UPDATE (SERVICE LIFECYCLE) - NEW ROUTES ADDED HERE
// These routes are called by the Garage App to update the request status.
// =========================================================================

// PUT /api/notifications/:id/accept
// Garage accepts the request: sets status to GARAGE_ACCEPTED
// router.put("/:id/accept", acceptRequest);

// // PUT /api/notifications/:id/decline
// // Garage declines the request: sets status to GARAGE_DECLINED
// router.put("/:id/decline", declineRequest);

// // PUT /api/notifications/:id/complete
// // Garage/Driver marks service as complete: sets status to SERVICE_COMPLETED
// router.put("/:id/complete", completeService);

router.put("/:id/:statusAction", updateNotificationStatus);

// DELETE /api/notifications/:id
router.delete("/:id", deleteNotification);

// DELETE /api/notifications (ADMIN operation)
router.delete("/", deleteAllNotifications);

export default router;
