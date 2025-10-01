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

    // --- MODIFIED FIELD for Multiple User References ---
    // User requested 'userId' which is defined here as an array
    // to allow a single Garage to be associated with many User documents.
    userId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    fcmToken: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Garage", garageSchema);
