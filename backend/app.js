import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import garageRoutes from "./routes/garageRoutes.js";
import adminRoutes from "./routes/userRoutes.js";
import admin from "firebase-admin";
import serviceAccount from "./config/firebase.js";
// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log("Firebase Admin initialized ✅");

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // parse JSON requests

// Routes
app.use("/api/garages", garageRoutes);
app.use("/api/admin", adminRoutes); // for admin routes

// Root route
app.get("/", (req, res) => {
  res.send("GarageGo Backend is running");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
