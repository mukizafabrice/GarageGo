import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    driverName: {
      type: String,
      required: true,
      trim: true,
    },
    driverPhoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    driverLocation: {
      // Stored as GeoJSON Point [longitude, latitude]
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },

    // ------------------------------------
    // 2. Nearest Garage Details (Simplified)
    // ------------------------------------
    nearestGarage: {
      garageId: {
        // Only store the reference ID. Name/Token can be fetched via 'populate'.
        type: mongoose.Schema.Types.ObjectId,
        ref: "Garage",
        required: false,
      },
    },

    // ------------------------------------
    // 3. Status and Expo Ticket Information
    // ------------------------------------
    notificationStatus: {
      type: String,
      enum: [
        // Existing initial sending outcome statuses
        "SENT_SUCCESS",
        "NO_GARAGE_FOUND",
        "INVALID_TOKEN",
        "SEND_FAILED",
        "SERVER_ERROR",

        // --- NEW Service & Response Statuses ---
        "SENT_RECEIVED", // Notification received by garage app
        "GARAGE_ACCEPTED", // Garage agrees to help the driver (equivalent to "works with driver")
        "GARAGE_DECLINED", // Garage cannot or will not help the driver (equivalent to "don't work with driver vehicle/too busy")
        "SERVICE_COMPLETED", // The job is done
        "DRIVER_CANCELED", // Driver canceled the request
        "EXPIRED", // Request timed out
      ],
      required: true,
    },
    expoTicket: {
      // Stores the response chunk from expo.sendPushNotificationsAsync (for receipt tracking)
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    userFcmToken: {
      // FCM token of the user (driver) who made the request - for reverse notifications
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for location-based queries
NotificationSchema.index({ driverLocation: "2dsphere" });

const Notification = mongoose.model("Notification", NotificationSchema);

export default Notification;
