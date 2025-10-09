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
    const newRequestsCount = await Notification.countDocuments({
      "nearestGarage.garageId": garageId,
      notificationStatus: "SENT_SUCCESS",
    });
    return res.status(200).json({ success: true, count: newRequestsCount });
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
    const activeJobsCount = await Notification.countDocuments({
      "nearestGarage.garageId": garageId,
      notificationStatus: "GARAGE_ACCEPTED",
    });
    return res.status(200).json({ success: true, count: activeJobsCount });
  } catch (error) {
    console.error(`Error fetching active jobs count: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error while retrieving active jobs count.",
    });
  }
};

export const calculateAcceptanceRate = async (garageId) => {
  // Ensure garageId is a valid ObjectId for matching
  const garageObjectId = new mongoose.Types.ObjectId(garageId);

  try {
    const result = await Notification.aggregate([
      // 1. Filter notifications by garageId and the three actionable statuses
      {
        $match: {
          "nearestGarage.garageId": garageObjectId,
          notificationStatus: {
            $in: ["GARAGE_ACCEPTED", "GARAGE_DECLINED", "SENT_SUCCESS"],
          },
        },
      },

      // 2. Group all matching documents and count accepted vs. total
      {
        $group: {
          _id: null, // Group into a single document
          // Count accepted jobs
          totalAccepted: {
            $sum: {
              $cond: [
                { $eq: ["$notificationStatus", "GARAGE_ACCEPTED"] },
                1,
                0,
              ],
            },
          },
          // Total actionable requests (the denominator)
          totalActionableRequests: { $sum: 1 },
        },
      },
      // 3. Project the final calculated percentage
      {
        $project: {
          _id: 0,
          totalActionableRequests: "$totalActionableRequests",
          acceptanceRate: {
            $cond: {
              // If totalActionableRequests is zero, return 0%
              if: { $eq: ["$totalActionableRequests", 0] },
              then: 0,
              else: {
                $multiply: [
                  { $divide: ["$totalAccepted", "$totalActionableRequests"] },
                  100,
                ],
              },
            },
          },
        },
      },
    ]);

    // If the result array is empty (no actionable requests found), return defaults.
    return result[0] || { totalActionableRequests: 0, acceptanceRate: 0 };
  } catch (error) {
    console.error("Error calculating acceptance rate:", error);
    // Throw an error to be handled by the Express/route layer
    throw new Error(
      "Failed to calculate garage acceptance rate due to database error."
    );
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
export const getGarageAcceptedNotifications = async (req, res) => {
  const { garageId } = req.params;

  try {
    const notifications = await Notification.find({
      "nearestGarage.garageId": garageId,
      notificationStatus: "GARAGE_ACCEPTED",
      createdAt: { $gte: oneDayAgo },
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
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
