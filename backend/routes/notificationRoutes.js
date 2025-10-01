import express from 'express';

import {
  findAllNotifications,
  findNotificationById,
  updateNotificationStatus,
  deleteNotification,
  deleteAllNotifications,
  findAllNotificationsByGarageId, 
  deleteAllNotificationsByGarageId, 
} from '../controllers/notificationController.js'; // Adjust path as necessary

const router = express.Router();
router.get('/', findAllNotifications);

// DELETE /api/notifications
// Clear all notification logs (ADMIN operation)
router.delete('/', deleteAllNotifications);

// =========================================================
// PUBLIC/ADMIN ROUTES for SINGLE NOTIFICATION
// Base URL: /api/notifications/:id
// =========================================================

// GET /api/notifications/:id
// Retrieve a single notification by its ID
router.get('/:id', findNotificationById);

// PUT /api/notifications/:id
// Update a single notification's status (e.g., for receipt verification)
router.put('/:id', updateNotificationStatus);

// DELETE /api/notifications/:id
// Delete a single notification log
router.delete('/:id', deleteNotification);

// =========================================================
// GARAGE-SPECIFIC ROUTES (for dashboard/garage portal)
// Base URL: /api/notifications/garage/:garageId
// =========================================================

// GET /api/notifications/garage/:garageId
// Retrieve all notifications specifically routed to a single garage
router.get('/garage/:garageId', findAllNotificationsByGarageId);

// DELETE /api/notifications/garage/:garageId
// Clear all notification logs associated with a specific garage
router.delete('/garage/:garageId', deleteAllNotificationsByGarageId);


export default router;
