// seed.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js"; // Adjust path as needed
import Garage from "./models/Garage.js"; // Adjust path as needed

const { MONGO_URI } = process.env;

const seedDB = async () => {
  try {
    // 1. Connect to the database
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB Connected for Seeding");

    // 2. Clear existing data (optional, but good for fresh seeds)
    await User.deleteMany({});
    await Garage.deleteMany({});
    console.log("Existing data cleared.");

    // 3. Create Users
    const salt = await bcrypt.genSalt(10);

    const hashedPasswordAdmin = await bcrypt.hash("admin123", salt);
    const adminUser = await User.create({
      name: "Super Admin",
      email: "admin@example.com",
      password: hashedPasswordAdmin,
      role: "admin",
    });

    const hashedPasswordOwner1 = await bcrypt.hash("owner123", salt);
    const garageOwner1 = await User.create({
      name: "Gara Owner One",
      email: "owner1@example.com",
      password: hashedPasswordOwner1,
      role: "garageOwner",
    });

    const hashedPasswordOwner2 = await bcrypt.hash("owner234", salt);
    const garageOwner2 = await User.create({
      name: "Gara Owner Two",
      email: "owner2@example.com",
      password: hashedPasswordOwner2,
      role: "garageOwner",
    });

    const hashedPasswordUser = await bcrypt.hash("user456", salt);
    const staff = await User.create({
      name: "Regular Customer",
      email: "customer@example.com",
      password: hashedPasswordUser,
      role: "user",
    });

    console.log("Users seeded successfully.");

    // 4. Create Garages, linking to garageOwners
    await Garage.create([
      {
        name: "AutoFix Pro",
        description: "Full-service repair shop specializing in European cars.",
        latitude: 34.0522,
        longitude: -118.2437,
        address: "123 Main St, Los Angeles, CA",
        phone: "555-1234",
        services: ["Oil Change", "Brake Repair", "Engine Diagnostics"],
        userId: [garageOwner1._id],
        fcmToken: ["token123"],
      },
      {
        name: "Quick Lube Corner",
        description: "Fast oil and fluid services.",
        latitude: 34.0001,
        longitude: -118.5,
        address: "456 Oak Ave, Santa Monica, CA",
        phone: "555-5678",
        services: ["Oil Change", "Tire Rotation"],
        userId: [garageOwner1._id, staff._id], // Link to multiple owners
      },
    ]);

    console.log("Garages seeded successfully.");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  } finally {
    // 5. Disconnect from the database
    await mongoose.disconnect();
    console.log("MongoDB Disconnected.");
    process.exit(0);
  }
};

seedDB();
