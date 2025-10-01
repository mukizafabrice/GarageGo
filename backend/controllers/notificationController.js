// Import the Notification model
import Notification from "../models/Notification.js"; // Adjust path as necessary
import mongoose from "mongoose";

export const findAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({})
      .sort({ createdAt: -1 })
    //   .limit(100)
      .populate("nearestGarage.garageId", "name phone address")
      .lean();

    return res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    console.error(`Error fetching all notifications: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error while retrieving notifications.",
    });
  }
};

// =========================================================================
// R - READ ONE: Retrieve a single notification by ID
// (Existing function, kept for completeness)
// =========================================================================
export const findNotificationById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Notification ID format.",
    });
  }

  try {
    const notification = await Notification.findById(id)
      .populate("nearestGarage.garageId", "name phone address")
      .lean();

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification log not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error(`Error fetching notification by ID: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error while retrieving notification.",
    });
  }
};


export const findAllNotificationsByGarageId = async (req, res) => {
  const { garageId } = req.params;

  // 1. Validate the garageId format
  if (!mongoose.Types.ObjectId.isValid(garageId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Garage ID format.",
    });
  }

  try {
    // 2. Find all notifications where the garageId matches the requested ID
    const notifications = await Notification.find({
      "nearestGarage.garageId": garageId,
    })
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(100) // Limit to a reasonable number for dashboard view
      .populate("nearestGarage.garageId", "name phone address")
      .lean();

    return res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    console.error(
      `Error fetching notifications for garage ${garageId}: ${error.message}`
    );
    return res.status(500).json({
      success: false,
      message: "Server error while retrieving garage-specific notifications.",
    });
  }
};

// =========================================================================
// U - UPDATE: Update the status (Existing function, kept for completeness)
// =========================================================================
export const updateNotificationStatus = async (req, res) => {
  const { id } = req.params;
  const { newStatus, newExpoTicket } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Notification ID format." });
  }
  if (!newStatus) {
    return res
      .status(400)
      .json({ success: false, message: "Missing newStatus field." });
  }

  const validStatuses = [
    "SENT_SUCCESS",
    "NO_GARAGE_FOUND",
    "INVALID_TOKEN",
    "SEND_FAILED",
    "SERVER_ERROR",
  ];
  if (!validStatuses.includes(newStatus)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status provided: ${newStatus}.`,
    });
  }

  try {
    const updateData = {
      notificationStatus: newStatus,
      ...(newExpoTicket && { expoTicket: newExpoTicket }),
      updatedAt: Date.now(),
    };

    const notification = await Notification.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification log not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Notification status updated successfully.",
      data: notification,
    });
  } catch (error) {
    console.error(`Error updating notification status: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error while updating notification.",
    });
  }
};

// =========================================================================
// D - DELETE ONE: Delete a single notification by ID (Existing function, kept for completeness)
// =========================================================================
export const deleteNotification = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Notification ID format.",
    });
  }

  try {
    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification log not found.",
      });
    }

    return res.status(204).json({ success: true, data: null });
  } catch (error) {
    console.error(`Error deleting notification: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting notification.",
    });
  }
};

// =========================================================================
// D - DELETE ALL BY GARAGE ID: Clear all notification logs for a specific garage
// =========================================================================
export const deleteAllNotificationsByGarageId = async (req, res) => {
  const { garageId } = req.params;

  // 1. Validate the garageId format
  if (!mongoose.Types.ObjectId.isValid(garageId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Garage ID format.",
    });
  }

  try {
    // 2. Delete all documents where 'nearestGarage.garageId' matches the ID
    const result = await Notification.deleteMany({
      "nearestGarage.garageId": garageId,
    });

    return res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} logs for garage ID ${garageId}.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error(
      `Error deleting notifications for garage ${garageId}: ${error.message}`
    );
    return res.status(500).json({
      success: false,
      message: "Server error while deleting garage-specific notifications.",
    });
  }
};

// =========================================================================
// D - DELETE ALL: Clear all notification logs (Existing function, kept for completeness)
// =========================================================================
export const deleteAllNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({});

    return res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} notification logs.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error(`Error deleting all notifications: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting all notifications.",
    });
  }
};
