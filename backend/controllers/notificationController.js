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

// export const updateNotificationStatus = async (req, res) => {
//   const { id } = req.params;
//   const { newStatus, newExpoTicket } = req.body;

//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Invalid Notification ID format." });
//   }
//   if (!newStatus) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Missing newStatus field." });
//   }

//   // --- UPDATED: Include all new valid service statuses ---
//   const validStatuses = [
//     // Initial Sending Statuses
//     "SENT_SUCCESS",
//     "NO_GARAGE_FOUND",
//     "INVALID_TOKEN",
//     "SEND_FAILED",
//     "SERVER_ERROR",
//     // New Service/Response Statuses
//     "SENT_RECEIVED",
//     "GARAGE_ACCEPTED",
//     "GARAGE_DECLINED",
//     "SERVICE_COMPLETED",
//     "DRIVER_CANCELED",
//     "EXPIRED",
//   ];
//   if (!validStatuses.includes(newStatus)) {
//     return res.status(400).json({
//       success: false,
//       message: `Invalid status provided: ${newStatus}. Must be one of: ${validStatuses.join(
//         ", "
//       )}`,
//     });
//   }
//   // --- END UPDATED VALIDATION ---

//   try {
//     const updateData = {
//       notificationStatus: newStatus,
//       ...(newExpoTicket && { expoTicket: newExpoTicket }),
//       updatedAt: Date.now(),
//     };

//     const notification = await Notification.findByIdAndUpdate(
//       id,
//       { $set: updateData },
//       { new: true, runValidators: true }
//     );

//     if (!notification) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Notification log not found." });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Notification status updated successfully.",
//       data: notification,
//     });
//   } catch (error) {
//     console.error(`Error updating notification status: ${error.message}`);
//     return res.status(500).json({
//       success: false,
//       message: "Server error while updating notification.",
//     });
//   }
// };

// =========================================================================
// U - UPDATE: Garage Accepts the Service Request
// Endpoint: PUT /api/notifications/:id/accept
// =========================================================================
export const acceptRequest = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Notification ID format." });
  }

  try {
    const notification = await Notification.findByIdAndUpdate(
      id,
      {
        $set: {
          notificationStatus: "GARAGE_ACCEPTED",
          updatedAt: Date.now(),
        },
      },
      { new: true, runValidators: true }
    ).populate("nearestGarage.garageId", "name");

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification log not found." });
    }

    // Send push notification back to the driver informing them that the garage has accepted
    if (notification.userFcmToken) {
      try {
        const expo = (await import("expo-server-sdk")).Expo;
        const expoClient = new expo();

        const message = {
          to: notification.userFcmToken,
          sound: "default",
          title: "✅ Request Accepted",
          body: `${notification.nearestGarage?.garageId?.name || "Garage"} has accepted your service request. They will contact you soon.`,
          data: {
            notificationId: notification._id,
            status: "GARAGE_ACCEPTED",
            garageName: notification.nearestGarage?.garageId?.name,
          },
        };

        await expoClient.sendPushNotificationsAsync([message]);
        console.log(`✅ Reverse notification sent to driver: ${notification.driverName}`);
      } catch (pushError) {
        console.error(`❌ Failed to send reverse notification to driver: ${pushError.message}`);
        // Don't fail the request if push notification fails
      }
    }

    return res.status(200).json({
      success: true,
      message: "Service request accepted by garage.",
      data: notification,
    });
  } catch (error) {
    console.error(`Error accepting request: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error while accepting request.",
    });
  }
};

// =========================================================================
// U - UPDATE: Garage Declines the Service Request
// Endpoint: PUT /api/notifications/:id/decline
// =========================================================================
export const declineRequest = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Notification ID format." });
  }

  try {
    const notification = await Notification.findByIdAndUpdate(
      id,
      {
        $set: {
          notificationStatus: "GARAGE_DECLINED",
          updatedAt: Date.now(),
        },
      },
      { new: true, runValidators: true }
    ).populate("nearestGarage.garageId", "name");

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification log not found." });
    }

    // Send push notification back to the driver informing them that the garage has declined
    if (notification.userFcmToken) {
      try {
        const expo = (await import("expo-server-sdk")).Expo;
        const expoClient = new expo();

        const message = {
          to: notification.userFcmToken,
          sound: "default",
          title: "❌ Request Declined",
          body: `${notification.nearestGarage?.garageId?.name || "Garage"} has declined your service request. Please try another garage.`,
          data: {
            notificationId: notification._id,
            status: "GARAGE_DECLINED",
            garageName: notification.nearestGarage?.garageId?.name,
          },
        };

        await expoClient.sendPushNotificationsAsync([message]);
        console.log(`✅ Decline notification sent to driver: ${notification.driverName}`);
      } catch (pushError) {
        console.error(`❌ Failed to send decline notification to driver: ${pushError.message}`);
        // Don't fail the request if push notification fails
      }
    }

    return res.status(200).json({
      success: true,
      message: "Service request declined by garage.",
      data: notification,
    });
  } catch (error) {
    console.error(`Error declining request: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error while declining request.",
    });
  }
};

// =========================================================================
// U - UPDATE: Garage/Driver Marks Service as Completed/Approved
// Endpoint: PUT /api/notifications/:id/complete
// =========================================================================
export const completeService = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Notification ID format." });
  }

  try {
    const notification = await Notification.findByIdAndUpdate(
      id,
      {
        $set: {
          notificationStatus: "SERVICE_COMPLETED",
          updatedAt: Date.now(),
        },
      },
      { new: true, runValidators: true }
    ).populate("nearestGarage.garageId", "name");

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification log not found." });
    }

    // Send push notification back to the driver informing them that the service is completed
    if (notification.userFcmToken) {
      try {
        const expo = (await import("expo-server-sdk")).Expo;
        const expoClient = new expo();

        const message = {
          to: notification.userFcmToken,
          sound: "default",
          title: "🎉 Service Completed",
          body: `Your service request with ${notification.nearestGarage?.garageId?.name || "Garage"} has been completed successfully.`,
          data: {
            notificationId: notification._id,
            status: "SERVICE_COMPLETED",
            garageName: notification.nearestGarage?.garageId?.name,
          },
        };

        await expoClient.sendPushNotificationsAsync([message]);
        console.log(`✅ Completion notification sent to driver: ${notification.driverName}`);
      } catch (pushError) {
        console.error(`❌ Failed to send completion notification to driver: ${pushError.message}`);
        // Don't fail the request if push notification fails
      }
    }

    // This is the final state. You might trigger payment processing or rating here.

    return res.status(200).json({
      success: true,
      message: "Service successfully marked as completed.",
      data: notification,
    });
  } catch (error) {
    console.error(`Error completing service: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error while completing service.",
    });
  }
};

export const updateNotificationStatus = async (req, res) => {
  // Extract both the notification ID and the action requested from the path
  const { id, statusAction } = req.params;

  // 1. Validation: ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Notification ID format." });
  }

  // 2. Determine the target status and response message based on the action
  let newStatus;
  let successMessage;

  switch (statusAction.toLowerCase()) {
    case "accept":
      newStatus = "GARAGE_ACCEPTED";
      successMessage = "Service request accepted by garage.";
      break;

    case "decline":
      newStatus = "GARAGE_DECLINED";
      successMessage = "Service request declined by garage.";
      break;

    case "complete":
      newStatus = "SERVICE_COMPLETED";
      successMessage = "Service successfully marked as completed.";
      // You can add checks here (e.g., if(req.user.role !== 'garage') throw error)
      break;

    default:
      // If the action is not recognized, return an error
      return res.status(400).json({
        success: false,
        message:
          "Invalid status action specified. Must be 'accept', 'decline', or 'complete'.",
      });
  }

  // 3. Database Update Logic
  try {
    const notification = await Notification.findByIdAndUpdate(
      id,
      {
        $set: {
          notificationStatus: newStatus,
          updatedAt: Date.now(),
        },
      },
      // { new: true } returns the updated document. { runValidators: true } ensures status is valid enum.
      { new: true, runValidators: true }
    ).populate("nearestGarage.garageId", "name");

    // Check if the document was found and updated
    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification log not found." });
    }

    // 4. Send push notification back to the driver for status updates
    if (notification.userFcmToken) {
      try {
        const expo = (await import("expo-server-sdk")).Expo;
        const expoClient = new expo();

        let title, body;
        switch (newStatus) {
          case "GARAGE_ACCEPTED":
            title = "✅ Request Accepted";
            body = `${notification.nearestGarage?.garageId?.name || "Garage"} has accepted your service request. They will contact you soon.`;
            break;
          case "GARAGE_DECLINED":
            title = "❌ Request Declined";
            body = `${notification.nearestGarage?.garageId?.name || "Garage"} has declined your service request. Please try another garage.`;
            break;
          case "SERVICE_COMPLETED":
            title = "🎉 Service Completed";
            body = `Your service request with ${notification.nearestGarage?.garageId?.name || "Garage"} has been completed successfully.`;
            break;
          default:
            title = "Request Update";
            body = `Your service request status has been updated.`;
        }

        const message = {
          to: notification.userFcmToken,
          sound: "default",
          title: title,
          body: body,
          data: {
            notificationId: notification._id,
            status: newStatus,
            garageName: notification.nearestGarage?.garageId?.name,
          },
        };

        await expoClient.sendPushNotificationsAsync([message]);
        console.log(`✅ Status update notification sent to driver: ${notification.driverName} (${newStatus})`);
      } catch (pushError) {
        console.error(`❌ Failed to send status update notification to driver: ${pushError.message}`);
        // Don't fail the request if push notification fails
      }
    }

    // 4. Success Response
    return res.status(200).json({
      success: true,
      message: successMessage,
      data: notification,
    });
  } catch (error) {
    console.error(
      `Error processing request for status ${statusAction}: ${error.message}`
    );
    return res.status(500).json({
      success: false,
      message: `Server error while processing ${statusAction} request.`,
    });
  }
};

// export const updateNotificationSentStatus = async (req, res) => {
//   const { id } = req.params;
//   const { newStatus, newExpoTicket } = req.body;

//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Invalid Notification ID format." });
//   }
//   if (!newStatus) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Missing newStatus field." });
//   }

//   // --- UPDATED: Include all new valid service statuses ---
//   const validStatuses = [
//     // Initial Sending Statuses
//     "SENT_SUCCESS",
//     "NO_GARAGE_FOUND",
//     "INVALID_TOKEN",
//     "SEND_FAILED",
//     "SERVER_ERROR",
//     // New Service/Response Statuses
//     "SENT_RECEIVED",
//     "GARAGE_ACCEPTED",
//     "GARAGE_DECLINED",
//     "SERVICE_COMPLETED",
//     "DRIVER_CANCELED",
//     "EXPIRED",
//   ];
//   if (!validStatuses.includes(newStatus)) {
//     return res.status(400).json({
//       success: false,
//       message: `Invalid status provided: ${newStatus}. Must be one of: ${validStatuses.join(
//         ", "
//       )}`,
//     });
//   }
//   // --- END UPDATED VALIDATION ---

//   try {
//     const updateData = {
//       notificationStatus: newStatus,
//       ...(newExpoTicket && { expoTicket: newExpoTicket }),
//       updatedAt: Date.now(),
//     };

//     const notification = await Notification.findByIdAndUpdate(
//       id,
//       { $set: updateData },
//       { new: true, runValidators: true }
//     );

//     if (!notification) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Notification log not found." });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Notification status updated successfully.",
//       data: notification,
//     });
//   } catch (error) {
//     console.error(`Error updating notification status: ${error.message}`);
//     return res.status(500).json({
//       success: false,
//       message: "Server error while updating notification.",
//     });
//   }
// };
