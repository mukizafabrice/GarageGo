import Garage from "../models/Garage.js";
import { calculateDistance } from "../utils/distance.js";
import { Expo } from "expo-server-sdk";

// Initialize a new Expo SDK client
const expo = new Expo();

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
 * @desc    Get a single garage by User ID
 * @route   GET /api/garages/user/:userId
 * @access  Public
 */
export const getGarageByUserId = async (req, res) => {
  try {
    // We use findOne since a user should only have one garage.
    const garage = await Garage.findOne({ userId: req.params.userId }).populate(
      "userId",
      "name email"
    );

    if (!garage) {
      return res
        .status(404)
        .json({ success: false, message: "Garage not found for this user." });
    }

    res.json({ success: true, data: garage });
  } catch (error) {
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

    console.log(
      `✅ Received request from driver at Lat: ${latitude}, Lng: ${longitude}`
    );

    const allGarages = await Garage.find();

    console.log(`🔎 Total garages found in database: ${allGarages.length}`);

    if (allGarages.length === 0) {
      return res.json({
        success: false,
        message: "No garages found in the database.",
      });
    }

    let nearestGarage = null;
    let minDistance = Infinity;

    for (const garage of allGarages) {
      const distance = calculateDistance(
        latitude,
        longitude,
        garage.latitude,
        garage.longitude
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestGarage = garage;
      }
    }

    if (!nearestGarage || !nearestGarage.fcmToken) {
      console.log("No nearest garage with a valid FCM token was found.");
      return res.json({
        success: false,
        message: "No nearest garage with a valid FCM token was found.",
      });
    }

    // Check that the nearest garage's token is a valid Expo push token
    if (!Expo.isExpoPushToken(nearestGarage.fcmToken)) {
      console.error(
        `❌ Push token ${nearestGarage.fcmToken} is not a valid Expo push token.`
      );
      return res.json({
        success: false,
        message: "Failed to send notification: Invalid push token.",
      });
    }

    console.log(`✅ Found nearest garage: ${nearestGarage.name}`);

    // Create the message object in the format required by expo-server-sdk
    const message = {
      to: nearestGarage.fcmToken,
      sound: "default",
      title: "🚨 New Assistance Request",
      body: "A driver needs your help! Tap for details.",
      data: {
        driverLat: latitude.toString(),
        driverLng: longitude.toString(),
      },
    };

    try {
      // Send the notification using the Expo SDK
      let ticketChunk = await expo.sendPushNotificationsAsync([message]);
      console.log(
        `✅ Notification sent to nearest garage: ${nearestGarage.name}`,
        ticketChunk
      );
      res.json({
        success: true,
        nearestGarage: nearestGarage,
        message: "Nearest garage found and notified successfully.",
      });
    } catch (error) {
      console.error(
        `❌ Failed to send notification to ${nearestGarage.name}`,
        error
      );
      res.json({
        success: false,
        message: "Failed to send notification to the nearest garage.",
      });
    }
  } catch (error) {
    console.error(`❌ Error in findNearestGarage: ${error.message}`);
    res.status(500).json({ success: false, message: "Server error" });
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
export const updateGarageToken = async (garageId, fcmToken) => {
  console.log("Updating token for garageId:", garageId);
  const garage = await Garage.findByIdAndUpdate(
    garageId,
    { fcmToken },
    { new: true }
  );
  if (!garage) throw new Error("Garage not found");
  return garage;
};
