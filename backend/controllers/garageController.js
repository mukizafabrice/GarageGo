import Garage from "../models/Garage.js";
import { calculateDistance } from "../utils/distance.js";
import { Expo } from "expo-server-sdk";
import Notification from "../models/Notification.js"; // Adjust the path as needed
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
      "name email role"
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
      "name email role"
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

// The updated controller function
export const findNearestGarage = async (req, res) => {
  // Capture request body parameters
  const { latitude, longitude, name, phoneNumber } = req.body;

  // Convert lat/lng to numbers immediately for use
  const driverLat = parseFloat(latitude);
  const driverLng = parseFloat(longitude);

  try {
    // Basic validation
    if (!driverLat || !driverLng || !name || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields (latitude, longitude, name, or phoneNumber).",
      });
    }

    console.log(
      `✅ Received request from driver: ${name} (${phoneNumber}) at Lat: ${driverLat}, Lng: ${driverLng}`
    );

    const allGarages = await Garage.find();
    console.log(`🔎 Total garages found in database: ${allGarages.length}`);

    if (allGarages.length === 0) {
      // LOG: NO_GARAGE_FOUND
      const notificationLog = new Notification({
        driverName: name,
        driverPhoneNumber: phoneNumber,
        driverLocation: { type: "Point", coordinates: [driverLng, driverLat] },
        notificationStatus: "NO_GARAGE_FOUND",
      });
      await notificationLog.save();

      return res.json({
        success: false,
        message: "No garages found in the database.",
      });
    }

    let nearestGarage = null;
    let minDistance = Infinity;

    // Find the nearest garage
    for (const garage of allGarages) {
      const distance = calculateDistance(
        driverLat,
        driverLng,
        garage.latitude,
        garage.longitude
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestGarage = garage;
      }
    }

    // Check for nearest garage and a valid push token
    if (
      !nearestGarage ||
      !nearestGarage.fcmToken ||
      !Expo.isExpoPushToken(nearestGarage.fcmToken)
    ) {
      const tokenStatus = nearestGarage?.fcmToken
        ? "Invalid Token"
        : "No Token";
      console.log(
        `No nearest garage with a valid FCM token was found. Status: ${tokenStatus}`
      );

      // LOG: INVALID_TOKEN
      const notificationLog = new Notification({
        driverName: name,
        driverPhoneNumber: phoneNumber,
        driverLocation: { type: "Point", coordinates: [driverLng, driverLat] },
        nearestGarage: { garageId: nearestGarage._id },
        notificationStatus: "INVALID_TOKEN",
      });
      await notificationLog.save();

      return res.json({
        success: false,
        message: `No nearest garage with a valid push token was found.`,
      });
    }

    console.log(`✅ Found nearest garage: ${nearestGarage.name}`);

    // Create the notification message object
    const message = {
      to: nearestGarage.fcmToken,
      sound: "default",
      title: `🚨 NEW REQUEST: ${name}`,
      body: `Driver needs help! Contact: ${phoneNumber}.Tap for location details.`,
      data: {
        driverName: name,
        driverPhoneNumber: phoneNumber,
        driverLat: driverLat.toString(),
        driverLng: driverLng.toString(),
      },
    };

    try {
      // Send the notification using the Expo SDK
      let ticketChunk = await expo.sendPushNotificationsAsync([message]);

      // LOG: SENT_SUCCESS
      const notificationLog = new Notification({
        driverName: name,
        driverPhoneNumber: phoneNumber,
        driverLocation: { type: "Point", coordinates: [driverLng, driverLat] },
        nearestGarage: { garageId: nearestGarage._id },
        notificationStatus: "SENT_SUCCESS",
        expoTicket: ticketChunk, // Store the successful ticket response
      });
      await notificationLog.save();

      console.log(
        `✅ Notification sent to nearest garage: ${nearestGarage.name}`,
        ticketChunk
      );

      // Send the successful response back to the client
      res.json({
        success: true,
        nearestGarage: {
          name: nearestGarage.name,
          id: nearestGarage.id,
          latitude: nearestGarage.latitude,
          longitude: nearestGarage.longitude,
          address: nearestGarage.address,
          phone: nearestGarage.phone,
        },
        message: "Nearest garage found and notified successfully.",
      });
    } catch (sendError) {
      console.error(
        `❌ Failed to send notification to ${nearestGarage.name}`,
        sendError
      );

      // LOG: SEND_FAILED
      const notificationLog = new Notification({
        driverName: name,
        driverPhoneNumber: phoneNumber,
        driverLocation: { type: "Point", coordinates: [driverLng, driverLat] },
        nearestGarage: { garageId: nearestGarage._id },
        notificationStatus: "SEND_FAILED",
        expoTicket: { error: sendError.message }, // Log the error message
      });
      await notificationLog.save();

      res.json({
        success: false,
        message: "Failed to send notification to the nearest garage.",
      });
    }
  } catch (serverError) {
    console.error(`❌ Error in findNearestGarage: ${serverError.message}`);

    // LOG: SERVER_ERROR (Catch-all for unexpected issues)
    const notificationLog = new Notification({
      driverName: name,
      driverPhoneNumber: phoneNumber,
      driverLocation: { type: "Point", coordinates: [driverLng, driverLat] },
      notificationStatus: "SERVER_ERROR",
      expoTicket: { error: serverError.message },
    });
    await notificationLog.save();

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
