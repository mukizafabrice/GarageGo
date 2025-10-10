import Notification from "../models/Notification.js";
import mongoose from "mongoose";

export const fetchCountNewRequests = async (req, res) => {
  const garageId = req.params.garageId;

  if (!garageId || !mongoose.Types.ObjectId.isValid(garageId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid or missing garageId parameter.",
    });
  }

  try {
    // 🕐 Calculate 24-hour time range
    const now = new Date();
    const past24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 🔍 Count only new requests within the last 24 hours
    const newRequestsCount = await Notification.countDocuments({
      "nearestGarage.garageId": garageId,
      notificationStatus: "SENT_SUCCESS",
      createdAt: { $gte: past24Hours },
    });

    return res.status(200).json({
      success: true,
      count: newRequestsCount,
    });
  } catch (error) {
    console.error(`Error fetching new requests count: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error while retrieving new requests count.",
    });
  }
};

export const fetchCountActiveJobs = async (req, res) => {
  const garageId = req.params.garageId;

  if (!garageId || !mongoose.Types.ObjectId.isValid(garageId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid or missing garageId parameter.",
    });
  }

  try {
    // 🕐 Calculate 24-hour range
    const now = new Date();
    const past24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 🔍 Count GARAGE_ACCEPTED notifications created in the past 24 hours
    const activeJobsCount = await Notification.countDocuments({
      "nearestGarage.garageId": garageId,
      notificationStatus: "GARAGE_ACCEPTED",
      createdAt: { $gte: past24Hours },
    });

    return res.status(200).json({
      success: true,
      count: activeJobsCount,
    });
  } catch (error) {
    console.error(`Error fetching active jobs count: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error while retrieving active jobs count.",
    });
  }
};

export const calculateAcceptanceRate = async (req, res) => {
  const { garageId } = req.params;

  // ✅ Validate garageId
  if (!garageId || !mongoose.Types.ObjectId.isValid(garageId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid or missing garageId parameter.",
    });
  }

  const garageObjectId = new mongoose.Types.ObjectId(garageId);

  try {
    // 🕐 Calculate 24-hour time window
    const now = new Date();
    const past24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 🔍 Aggregate only notifications from the past 24 hours
    const result = await Notification.aggregate([
      {
        $match: {
          "nearestGarage.garageId": garageObjectId,
          notificationStatus: {
            $in: ["GARAGE_ACCEPTED", "GARAGE_DECLINED", "SENT_SUCCESS"],
          },
          createdAt: { $gte: past24Hours },
        },
      },
      {
        $group: {
          _id: null,
          totalAccepted: {
            $sum: {
              $cond: [
                { $eq: ["$notificationStatus", "GARAGE_ACCEPTED"] },
                1,
                0,
              ],
            },
          },
          totalActionableRequests: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          totalActionableRequests: 1,
          acceptanceRate: {
            $cond: {
              if: { $eq: ["$totalActionableRequests", 0] },
              then: 0,
              else: {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: ["$totalAccepted", "$totalActionableRequests"],
                      },
                      100,
                    ],
                  },
                  2, // Round to 2 decimal places
                ],
              },
            },
          },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      acceptanceRate: result[0]?.acceptanceRate || 0,
    });
  } catch (error) {
    console.error("Error calculating acceptance rate:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while calculating acceptance rate.",
    });
  }
};

// Helper to get "1 day ago" date
const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

// ✅ 1. SENT_SUCCESS notifications (last 24 hours)
export const getSentSuccessNotifications = async (req, res) => {
  const { garageId } = req.params;

  try {
    const notifications = await Notification.find({
      "nearestGarage.garageId": garageId,
      notificationStatus: "SENT_SUCCESS",
      createdAt: { $gte: oneDayAgo },
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    console.error("Error fetching SENT_SUCCESS notifications:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ✅ 2. GARAGE_ACCEPTED notifications (last 24 hours)
// Server-side code (Node.js/Express/Mongoose)
// Assuming Notification model is imported, and oneDayAgo is available

export const getGarageAcceptedNotifications = async (req, res) => {
  const { garageId } = req.params;

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const notifications = await Notification.find({
      "nearestGarage.garageId": garageId,
      notificationStatus: "GARAGE_ACCEPTED",
      createdAt: { $gte: oneDayAgo },
    })
      .sort({ createdAt: -1 })

      // ----------------------------------------------------
      // 💡 UPDATED POPULATE CALL BASED ON YOUR GARAGE SCHEMA
      // ----------------------------------------------------
      .populate({
        path: "nearestGarage.garageId",
        model: "Garage",
        // 🚨 Fetch only the fields needed for the frontend: coordinates and name
        select: "latitude longitude name",
      })
      .exec();

    // ----------------------------------------------------
    // 💡 POST-PROCESSING FOR CLEANER FRONTEND DATA STRUCTURE
    // ----------------------------------------------------
    const dataForClient = notifications.map((notif) => {
      const doc = notif.toObject ? notif.toObject() : notif;

      // The populated garage document is here
      const populatedGarage = doc.nearestGarage.garageId || null;

      return {
        ...doc,
        garageInfo: populatedGarage
          ? {
              id: populatedGarage._id,
              name: populatedGarage.name,
              // Combine latitude and longitude into a 'location' object
              // for easier consumption on the React Native side
              location: {
                latitude: populatedGarage.latitude,
                longitude: populatedGarage.longitude,
              },
            }
          : null,
      };
    });

    res.status(200).json({
      success: true,
      count: dataForClient.length,
      data: dataForClient, // Send the processed data
    });
  } catch (error) {
    console.error("Error fetching GARAGE_ACCEPTED notifications:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ✅ 3. SERVICE_COMPLETED notifications (last 24 hours)
export const getServiceCompletedNotifications = async (req, res) => {
  const { garageId } = req.params;

  try {
    const notifications = await Notification.find({
      "nearestGarage.garageId": garageId,
      notificationStatus: "SERVICE_COMPLETED",
      createdAt: { $gte: oneDayAgo },
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    console.error("Error fetching SERVICE_COMPLETED notifications:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * Update notification status (GARAGE_ACCEPTED or GARAGE_DECLINED)
 * @route PUT /notifications/:id/status
 * @body { notificationStatus: "GARAGE_ACCEPTED" | "GARAGE_DECLINED" }
 */
export const updateNotificationStatus = async (req, res) => {
  const { id } = req.params; // <-- use MongoDB _id
  const { notificationStatus } = req.body;

  // Validate ObjectId (No Change)
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid or missing notification ID.",
    });
  }

  // Validate status
  // ----------------------------------------------------
  // FIX: Added "SERVICE_COMPLETED" to the allowed statuses
  // ----------------------------------------------------
  const allowedStatuses = [
    "GARAGE_ACCEPTED",
    "GARAGE_DECLINED",
    "SERVICE_COMPLETED",
  ];

  if (!notificationStatus || !allowedStatuses.includes(notificationStatus)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Allowed: ${allowedStatuses.join(", ")}`,
    });
  }

  try {
    // Update the document (No Change)
    const updatedNotification = await Notification.findByIdAndUpdate(
      id,
      { notificationStatus },
      { new: true }
    ).populate("nearestGarage.garageId", "name email");

    if (!updatedNotification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    console.log(
      `[Notification Update] _id: ${id}, status: ${notificationStatus}, time: ${new Date().toISOString()}`
    );

    return res.status(200).json({
      success: true,
      message: `Notification status updated to ${notificationStatus}`,
      data: updatedNotification,
    });
  } catch (error) {
    console.error("[Notification Update Error]", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating notification status.",
    });
  }
};
