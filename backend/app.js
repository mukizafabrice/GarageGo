import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import garageRoutes from "./routes/garageRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import admin from "./config/firebase.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

console.log("Firebase Admin initialized ✅");

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Good practice to include for form data

const allowedOrigins = ["http://192.168.1.105:8081", "http://localhost:5000"];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Routes
app.use("/api/garages", garageRoutes);
app.use("/api/user", userRoutes); // for admin routes

// Root route
app.get("/", (req, res) => {
  res.send("GarageGo Backend is running");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
