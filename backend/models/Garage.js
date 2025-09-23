// models/Garage.js
import mongoose from "mongoose";

const garageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String },
    phone: { type: String },
    services: [{ type: String }],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fcmToken: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Garage", garageSchema);
