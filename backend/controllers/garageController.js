// controllers/garageController.js
import Garage from "../models/Garage.js";
import admin from "../config/firebase.js";
import Notification from "../models/Notification.js";
import { calculateDistance } from "../utils/distance.js";

/**
 * @desc    Create a new garage
 * @route   POST /api/garages
 * @access  Public (no auth for now)
 */
export const createGarage = async (req, res) => {
  try {
    const {
      userId,
      name,
      description,
      latitude,
      longitude,
      address,
      phone,
      services,
      fcmToken,
    } = req.body;

    if (!userId || !name || !latitude || !longitude) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide required fields" });
    }

    const garage = await Garage.create({
      userId,
      name,
      description,
      latitude,
      longitude,
      address,
      phone,
      services,
      fcmToken,
    });

    res.status(201).json({ success: true, data: garage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all garages
 * @route   GET /api/garages
 * @access  Public
 */
export const getGarages = async (req, res) => {
  try {
    const garages = await Garage.find().populate("userId", "name email");
    res.json({ success: true, data: garages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get a single garage by ID
 * @route   GET /api/garages/:id
 * @access  Public
 */
export const getGarageById = async (req, res) => {
  try {
    const garage = await Garage.findById(req.params.id).populate(
      "userId",
      "name email"
    );
    if (!garage)
      return res
        .status(404)
        .json({ success: false, message: "Garage not found" });

    res.json({ success: true, data: garage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get nearby garages and send notifications
 * @route   GET /api/garages/nearby?lat=xx&lng=yy&radius=5000
 * @access  Public
 */

/**
 * @desc    Get nearby garages and send notifications
 * @route   GET /api/garages/nearby?lat=xx&lng=yy&radius=5000
 * @access  Public
 */
export const getNearbyGarages = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const maxDistance = radius ? parseInt(radius) : 5000;

    // Simple search (replace with GeoJSON for production)
    const garages = await Garage.find({
      latitude: { $gte: parseFloat(lat) - 0.05, $lte: parseFloat(lat) + 0.05 },
      longitude: { $gte: parseFloat(lng) - 0.05, $lte: parseFloat(lng) + 0.05 },
    });

    let notificationsSent = 0;

    for (const garage of garages) {
      if (garage.fcmToken) {
        const message = {
          notification: {
            title: "🚨 Assistance Request",
            body: `Driver needs help near (${lat}, ${lng})`,
          },
          token: garage.fcmToken,
        };

        try {
          await admin.messaging().send(message);
          notificationsSent++;
          console.log(
            `✅ Notification sent to ${garage.name} (FCM token: ${garage.fcmToken})`
          );
        } catch (err) {
          console.error(
            `❌ Failed to send notification to ${garage.name}`,
            err
          );
        }
      } else {
        console.log(
          `⚠️ No FCM token for ${garage.name}, skipping notification`
        );
      }
    }

    res.json({
      success: true,
      data: garages,
      message: `Notifications sent to ${notificationsSent} garages`,
    });
  } catch (error) {
    console.error("❌ Error in getNearbyGarages:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Find nearest garage and notify it
 * @route   POST /api/garages/nearest
 * @access  Public
 */
export const findNearestGarage = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res
        .status(400)
        .json({ success: false, message: "Location required" });
    }

    const garages = await Garage.find();
    if (garages.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No garages available" });
    }

    // Find nearest garage
    let nearest = garages[0];
    let minDist = calculateDistance(
      latitude,
      longitude,
      nearest.latitude,
      nearest.longitude
    );

    garages.forEach((garage) => {
      const dist = calculateDistance(
        latitude,
        longitude,
        garage.latitude,
        garage.longitude
      );
      if (dist < minDist) {
        nearest = garage;
        minDist = dist;
      }
    });

    // Send notification if FCM token exists
    if (nearest.fcmToken) {
      const message = {
        notification: {
          title: "🚨 Assistance Request",
          body: `Driver near (${latitude}, ${longitude}) needs help.`,
        },
        token: nearest.fcmToken,
        data: {
          driverLat: latitude.toString(),
          driverLng: longitude.toString(),
          garageId: nearest._id.toString(),
        },
      };

      try {
        await admin.messaging().send(message);
        console.log(`✅ Notification sent to nearest garage: ${nearest.name}`);
      } catch (err) {
        console.error("❌ Failed to send notification", err);
      }
    }

    res.json({
      success: true,
      nearestGarage: nearest,
      distance: minDist,
      message: "Nearest garage found and notified",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update a garage
 * @route   PUT /api/garages/:id
 * @access  Public (no auth)
 */
export const updateGarage = async (req, res) => {
  try {
    const garage = await Garage.findById(req.params.id);
    if (!garage)
      return res
        .status(404)
        .json({ success: false, message: "Garage not found" });

    Object.assign(garage, req.body);

    const updatedGarage = await garage.save();
    res.json({ success: true, data: updatedGarage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete a garage
 * @route   DELETE /api/garages/:id
 * @access  Public (no auth)
 */
export const deleteGarage = async (req, res) => {
  try {
    const garage = await Garage.findById(req.params.id);
    if (!garage)
      return res
        .status(404)
        .json({ success: false, message: "Garage not found" });

    await garage.deleteOne();
    res.json({ success: true, message: "Garage removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
