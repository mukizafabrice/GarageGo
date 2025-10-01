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
        "SENT_SUCCESS",
        "NO_GARAGE_FOUND",
        "INVALID_TOKEN",
        "SEND_FAILED",
        "SERVER_ERROR", // Added for general try/catch errors
      ],
      required: true,
    },
    expoTicket: {
      // Stores the response chunk from expo.sendPushNotificationsAsync (for receipt tracking)
      type: mongoose.Schema.Types.Mixed,
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
