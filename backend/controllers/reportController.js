import Notification from "../models/Notification.js";
import Garage from "../models/Garage.js";
import User from "../models/User.js";
import mongoose from "mongoose";

// Garage Owner Report
export const getGarageOwnerReport = async (req, res) => {
  const { garageId } = req.params;
  const { period = 'daily' } = req.query; // daily, weekly, monthly

  if (!garageId || !mongoose.Types.ObjectId.isValid(garageId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid or missing garageId parameter.",
    });
  }

  try {
    // Calculate time range based on period
    const now = new Date();
    let startDate;

    switch (period) {
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default: // daily
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Get garage details
    const garage = await Garage.findById(garageId).populate('userId', 'name email');
    if (!garage) {
      return res.status(404).json({
        success: false,
        message: "Garage not found.",
      });
    }

    // Aggregate notification statistics
    const stats = await Notification.aggregate([
      {
        $match: {
          "nearestGarage.garageId": new mongoose.Types.ObjectId(garageId),
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          sentSuccess: {
            $sum: { $cond: [{ $eq: ["$notificationStatus", "SENT_SUCCESS"] }, 1, 0] }
          },
          garageAccepted: {
            $sum: { $cond: [{ $eq: ["$notificationStatus", "GARAGE_ACCEPTED"] }, 1, 0] }
          },
          serviceCompleted: {
            $sum: { $cond: [{ $eq: ["$notificationStatus", "SERVICE_COMPLETED"] }, 1, 0] }
          },
          garageDeclined: {
            $sum: { $cond: [{ $eq: ["$notificationStatus", "GARAGE_DECLINED"] }, 1, 0] }
          },
          driverCanceled: {
            $sum: { $cond: [{ $eq: ["$notificationStatus", "DRIVER_CANCELED"] }, 1, 0] }
          },
          expired: {
            $sum: { $cond: [{ $eq: ["$notificationStatus", "EXPIRED"] }, 1, 0] }
          }
        }
      }
    ]);

    const statData = stats[0] || {
      totalRequests: 0,
      sentSuccess: 0,
      garageAccepted: 0,
      serviceCompleted: 0,
      garageDeclined: 0,
      driverCanceled: 0,
      expired: 0
    };

    // Calculate rates
    const acceptanceRate = statData.sentSuccess > 0
      ? ((statData.garageAccepted / statData.sentSuccess) * 100).toFixed(2)
      : 0;

    const completionRate = statData.garageAccepted > 0
      ? ((statData.serviceCompleted / statData.garageAccepted) * 100).toFixed(2)
      : 0;

    // Get recent notifications (last 10)
    const recentNotifications = await Notification.find({
      "nearestGarage.garageId": garageId,
      createdAt: { $gte: startDate }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('driverName driverPhoneNumber notificationStatus createdAt');

    // Get user count for the garage
    const userCount = garage.userId ? garage.userId.length : 0;

    const report = {
      garage: {
        id: garage._id,
        name: garage.name,
        owner: garage.userId?.[0]?.name || 'N/A',
        totalUsers: userCount
      },
      period: {
        type: period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString()
      },
      statistics: {
        totalRequests: statData.totalRequests,
        sentSuccess: statData.sentSuccess,
        garageAccepted: statData.garageAccepted,
        serviceCompleted: statData.serviceCompleted,
        garageDeclined: statData.garageDeclined,
        driverCanceled: statData.driverCanceled,
        expired: statData.expired,
        acceptanceRate: parseFloat(acceptanceRate),
        completionRate: parseFloat(completionRate)
      },
      recentActivity: recentNotifications.map(notif => ({
        id: notif._id,
        driverName: notif.driverName,
        driverPhone: notif.driverPhoneNumber,
        status: notif.notificationStatus,
        timestamp: notif.createdAt
      }))
    };

    res.status(200).json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error("Error generating garage owner report:", error);
    res.status(500).json({
      success: false,
      message: "Server error while generating report.",
      error: error.message
    });
  }
};

// Admin System Report
export const getAdminSystemReport = async (req, res) => {
  const { period = 'daily' } = req.query; // daily, weekly, monthly

  try {
    // Calculate time range based on period
    const now = new Date();
    let startDate;

    switch (period) {
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default: // daily
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Get system-wide statistics
    const [userStats, garageStats, notificationStats] = await Promise.all([
      // User statistics
      User.aggregate([
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 }
          }
        }
      ]),

      // Garage statistics
      Garage.countDocuments(),

      // Notification statistics for the period
      Notification.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: "$notificationStatus",
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Process user stats
    const userCounts = {
      total: 0,
      admins: 0,
      garageOwners: 0,
      users: 0
    };

    userStats.forEach(stat => {
      userCounts.total += stat.count;
      if (stat._id === 'admin') userCounts.admins = stat.count;
      else if (stat._id === 'garageOwner') userCounts.garageOwners = stat.count;
      else if (stat._id === 'user') userCounts.users = stat.count;
    });

    // Process notification stats
    const notificationCounts = {
      total: 0,
      sentSuccess: 0,
      garageAccepted: 0,
      serviceCompleted: 0,
      garageDeclined: 0,
      driverCanceled: 0,
      expired: 0,
      noGarageFound: 0,
      invalidToken: 0,
      sendFailed: 0,
      serverError: 0
    };

    notificationStats.forEach(stat => {
      notificationCounts.total += stat.count;
      switch (stat._id) {
        case 'SENT_SUCCESS': notificationCounts.sentSuccess = stat.count; break;
        case 'GARAGE_ACCEPTED': notificationCounts.garageAccepted = stat.count; break;
        case 'SERVICE_COMPLETED': notificationCounts.serviceCompleted = stat.count; break;
        case 'GARAGE_DECLINED': notificationCounts.garageDeclined = stat.count; break;
        case 'DRIVER_CANCELED': notificationCounts.driverCanceled = stat.count; break;
        case 'EXPIRED': notificationCounts.expired = stat.count; break;
        case 'NO_GARAGE_FOUND': notificationCounts.noGarageFound = stat.count; break;
        case 'INVALID_TOKEN': notificationCounts.invalidToken = stat.count; break;
        case 'SEND_FAILED': notificationCounts.sendFailed = stat.count; break;
        case 'SERVER_ERROR': notificationCounts.serverError = stat.count; break;
      }
    });

    // Calculate system-wide rates
    const systemAcceptanceRate = notificationCounts.sentSuccess > 0
      ? ((notificationCounts.garageAccepted / notificationCounts.sentSuccess) * 100).toFixed(2)
      : 0;

    const systemCompletionRate = notificationCounts.garageAccepted > 0
      ? ((notificationCounts.serviceCompleted / notificationCounts.garageAccepted) * 100).toFixed(2)
      : 0;

    // Get top performing garages
    const topGarages = await Notification.aggregate([
      {
        $match: {
          notificationStatus: "SERVICE_COMPLETED",
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$nearestGarage.garageId",
          completedServices: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "garages",
          localField: "_id",
          foreignField: "_id",
          as: "garage"
        }
      },
      {
        $unwind: "$garage"
      },
      {
        $project: {
          name: "$garage.name",
          completedServices: 1
        }
      },
      {
        $sort: { completedServices: -1 }
      },
      {
        $limit: 5
      }
    ]);

    const report = {
      period: {
        type: period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString()
      },
      systemOverview: {
        totalUsers: userCounts.total,
        totalGarages: garageStats,
        totalNotifications: notificationCounts.total,
        userBreakdown: {
          admins: userCounts.admins,
          garageOwners: userCounts.garageOwners,
          staffUsers: userCounts.users
        }
      },
      notificationStatistics: {
        ...notificationCounts,
        acceptanceRate: parseFloat(systemAcceptanceRate),
        completionRate: parseFloat(systemCompletionRate)
      },
      topPerformingGarages: topGarages.map(garage => ({
        name: garage.name,
        completedServices: garage.completedServices
      })),
      systemHealth: {
        successRate: notificationCounts.sentSuccess > 0
          ? ((notificationCounts.sentSuccess / notificationCounts.total) * 100).toFixed(2)
          : 0,
        errorRate: ((notificationCounts.invalidToken + notificationCounts.sendFailed + notificationCounts.serverError) / notificationCounts.total * 100).toFixed(2)
      }
    };

    res.status(200).json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error("Error generating admin system report:", error);
    res.status(500).json({
      success: false,
      message: "Server error while generating report.",
      error: error.message
    });
  }
};