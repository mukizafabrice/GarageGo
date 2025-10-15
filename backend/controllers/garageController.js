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
  const { latitude, longitude, name, phoneNumber, selectedGarageId, userFcmToken } = req.body;

  // Convert lat/lng to numbers immediately for use
  const driverLat = parseFloat(latitude);
  const driverLng = parseFloat(longitude);

  try {
    // --- RESTORED: Basic validation ---
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

    // --- RESTORED: Check for 0 garages and log ---
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

    // --- Find the nearest garage or specific garage if selected ---
    if (selectedGarageId) {
      // If a specific garage is selected, find it by ID
      nearestGarage = allGarages.find(garage => garage._id.toString() === selectedGarageId);
      if (nearestGarage) {
        minDistance = calculateDistance(
          driverLat,
          driverLng,
          nearestGarage.latitude,
          nearestGarage.longitude
        );
      }
    } else {
      // Find the nearest garage by distance
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
    }

    // --- LOGIC: Filter valid push tokens from the array ---
    const validTokens = nearestGarage?.fcmToken
      ? nearestGarage.fcmToken.filter((token) => Expo.isExpoPushToken(token))
      : [];

    // --- RESTORED: Check if nearest garage was found and has valid tokens ---
    if (!nearestGarage || validTokens.length === 0) {
      const tokenStatus =
        nearestGarage?.fcmToken?.length > 0 ? "Invalid Token(s)" : "No Token";

      console.log(
        `No nearest garage with a valid FCM token was found. Status: ${tokenStatus}`
      );

      // LOG: INVALID_TOKEN
      const notificationLog = new Notification({
        driverName: name,
        driverPhoneNumber: phoneNumber,
        driverLocation: { type: "Point", coordinates: [driverLng, driverLat] },
        nearestGarage: nearestGarage ? { garageId: nearestGarage._id } : null,
        notificationStatus: "INVALID_TOKEN",
      });
      await notificationLog.save();

      return res.json({
        success: false,
        message: `Nearest garage found, but it has no valid push tokens registered.`,
      });
    }

    // --- START OF FIX: PRE-INSTANTIATE NOTIFICATION LOG ---

    // 1. Create the new Notification instance now.
    // Mongoose automatically generates the '_id' property when the object is instantiated.
    const notificationLog = new Notification({
      driverName: name,
      driverPhoneNumber: phoneNumber,
      driverLocation: { type: "Point", coordinates: [driverLng, driverLat] },
      nearestGarage: { garageId: nearestGarage._id },
      notificationStatus: "PENDING_SENT", // Temporary status before send attempt
      userFcmToken: userFcmToken, // Store user's FCM token for reverse notifications
    });

    // We now have the ID to send: notificationLog._id

    // --- END OF FIX: PRE-INSTANTIATE NOTIFICATION LOG ---

    console.log(`✅ Found nearest garage: ${nearestGarage.name}`);

    // 2. Create the notification messages using the pre-generated ID
    const messages = validTokens.map((token) => ({
      to: token, // Send to the individual valid token
      sound: "default",
      title: `🚨 NEW REQUEST: ${name}`,
      body: `Driver needs help! Contact: ${phoneNumber}.Tap for location details.`,
      data: {
        driverName: name,
        driverPhoneNumber: phoneNumber,
        driverLat: driverLat.toString(),
        driverLng: driverLng.toString(),
        // INJECT THE ID HERE
        notificationId: notificationLog._id,
      },
    }));

    try {
      // Send the notifications using the Expo SDK
      let ticketChunks = await expo.sendPushNotificationsAsync(messages);

      // --- STALE TOKEN CLEANUP... (omitted for brevity)
      // NOTE: Stale token cleanup logic assumes ticketChunks is iterable,
      // which is correct for expo.sendPushNotificationsAsync()

      // 3. Update the existing notificationLog instance with success status and save it
      notificationLog.notificationStatus = "SENT_SUCCESS";
      notificationLog.expoTicket = ticketChunks;
      await notificationLog.save(); // Save the pre-instantiated document

      console.log(
        `✅ Notification sent to nearest garage: ${nearestGarage.name} across ${validTokens.length} tokens.`,
        ticketChunks
      );
      console.log(`📍 NotificationId: ${notificationLog._id}`);

      // Send the successful response back to the client
      res.json({
        success: true,
        notificationId: notificationLog._id,
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

      // 4. Update the existing notificationLog instance with failure status and save it
      notificationLog.notificationStatus = "SEND_FAILED";
      notificationLog.expoTicket = { error: sendError.message };
      await notificationLog.save(); // Save the pre-instantiated document

      res.json({
        success: false,
        message: "Failed to send notification to the nearest garage.",
      });
    }
  } catch (serverError) {
    console.error(`❌ Error in findNearestGarage: ${serverError.message}`);

    // LOG: SERVER_ERROR (Catch-all for unexpected issues)
    const notificationLog = new Notification({
      driverName: req.body.name, // Use req.body safely here
      driverPhoneNumber: req.body.phoneNumber,
      driverLocation: { type: "Point", coordinates: [driverLng, driverLat] },
      notificationStatus: "SERVER_ERROR",
      expoTicket: { error: serverError.message },
    });
    await notificationLog.save();

    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Find multiple nearby garages within specified radius
 * @route   POST /api/garages/nearby
 * @access  Public
 */
export const findNearbyGarages = async (req, res) => {
  try {
    const { 
      latitude, 
      longitude, 
      maxDistance = 50, // Default 50km radius
      limit = 10, // Default limit of 10 garages
      notifyAll = false, // Whether to send notifications to all found garages
      name, 
      phoneNumber 
    } = req.body;

    // Convert lat/lng to numbers
    const driverLat = parseFloat(latitude);
    const driverLng = parseFloat(longitude);

    // Validation
    if (!driverLat || !driverLng) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (latitude, longitude).",
      });
    }

    // Validate optional parameters
    const maxDist = Math.max(1, Math.min(parseFloat(maxDistance) || 50, 200)); // Between 1-200km
    const maxLimit = Math.max(1, Math.min(parseInt(limit) || 10, 50)); // Between 1-50 garages

    console.log(
      `🔍 Finding garages within ${maxDist}km of Lat: ${driverLat}, Lng: ${driverLng}`
    );

    const allGarages = await Garage.find();

    if (allGarages.length === 0) {
      return res.json({
        success: false,
        message: "No garages found in the database.",
        data: []
      });
    }

    // Calculate distances and filter garages within radius
    const nearbyGarages = [];
    
    for (const garage of allGarages) {
      const distance = calculateDistance(
        driverLat,
        driverLng,
        garage.latitude,
        garage.longitude
      );
      
      if (distance <= maxDist) {
        nearbyGarages.push({
          ...garage.toObject(),
          distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
        });
      }
    }

    // Sort by distance (nearest first)
    nearbyGarages.sort((a, b) => a.distance - b.distance);

    // Limit results
    const limitedGarages = nearbyGarages.slice(0, maxLimit);

    // If notification is requested, send to all found garages
    if (notifyAll && name && phoneNumber) {
      const notificationResults = [];
      
      for (const garage of limitedGarages) {
        const validTokens = garage.fcmToken
          ? garage.fcmToken.filter((token) => Expo.isExpoPushToken(token))
          : [];

        if (validTokens.length > 0) {
          try {
            // Create notification log
            const notificationLog = new Notification({
              driverName: name,
              driverPhoneNumber: phoneNumber,
              driverLocation: { type: "Point", coordinates: [driverLng, driverLat] },
              nearestGarage: { garageId: garage._id },
              notificationStatus: "PENDING_SENT",
            });

            // Create messages
            const messages = validTokens.map((token) => ({
              to: token,
              sound: "default",
              title: `🚨 NEW REQUEST: ${name}`,
              body: `Driver needs help! Contact: ${phoneNumber}. Distance: ${garage.distance}km`,
              data: {
                driverName: name,
                driverPhoneNumber: phoneNumber,
                driverLat: driverLat.toString(),
                driverLng: driverLng.toString(),
                notificationId: notificationLog._id,
                garageId: garage._id,
                distance: garage.distance.toString()
              },
            }));

            // Send notifications
            const ticketChunks = await expo.sendPushNotificationsAsync(messages);
            
            // Update notification log
            notificationLog.notificationStatus = "SENT_SUCCESS";
            notificationLog.expoTicket = ticketChunks;
            await notificationLog.save();

            notificationResults.push({
              garageId: garage._id,
              garageName: garage.name,
              status: "success",
              notificationId: notificationLog._id,
              tokensNotified: validTokens.length
            });

            console.log(`✅ Notification sent to ${garage.name} (${garage.distance}km away)`);
          } catch (error) {
            console.error(`❌ Failed to notify ${garage.name}:`, error);
            notificationResults.push({
              garageId: garage._id,
              garageName: garage.name,
              status: "failed",
              error: error.message
            });
          }
        } else {
          notificationResults.push({
            garageId: garage._id,
            garageName: garage.name,
            status: "no_tokens",
            message: "No valid push tokens found"
          });
        }
      }

      return res.json({
        success: true,
        message: `Found ${limitedGarages.length} nearby garages and sent notifications`,
        data: {
          garages: limitedGarages.map(garage => ({
            id: garage._id,
            name: garage.name,
            latitude: garage.latitude,
            longitude: garage.longitude,
            address: garage.address,
            phone: garage.phone,
            services: garage.services,
            distance: garage.distance
          })),
          notifications: notificationResults,
          searchParams: {
            maxDistance: maxDist,
            limit: maxLimit,
            totalFound: nearbyGarages.length
          }
        }
      });
    }

    // Return just the garage data without notifications
    return res.json({
      success: true,
      message: `Found ${limitedGarages.length} nearby garages`,
      data: {
        garages: limitedGarages.map(garage => ({
          id: garage._id,
          name: garage.name,
          latitude: garage.latitude,
          longitude: garage.longitude,
          address: garage.address,
          phone: garage.phone,
          services: garage.services,
          distance: garage.distance
        })),
        searchParams: {
          maxDistance: maxDist,
          limit: maxLimit,
          totalFound: nearbyGarages.length
        }
      }
    });

  } catch (error) {
    console.error(`❌ Error in findNearbyGarages: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: "Server error while finding nearby garages" 
    });
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

// ExponentPushToken[aD-aGvBosat6ofycBpZ50d]
