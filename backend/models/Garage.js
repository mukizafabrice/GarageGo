import mongoose from "mongoose";

const garageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  services: { type: [String] }, // e.g., ["Oil Change", "Tire Repair"]
});

const Garage = mongoose.model("Garage", garageSchema);
export default Garage;
