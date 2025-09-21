import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  garageId: { type: mongoose.Schema.Types.ObjectId, ref: "Garage" },
  driverLocation: {
    lat: Number,
    lng: Number,
  },
  message: String,
  sentAt: { type: Date, default: Date.now },
  status: { type: String, default: "sent" }, // or "failed"
});

export default mongoose.model("Notification", notificationSchema);
