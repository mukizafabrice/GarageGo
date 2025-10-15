import { axiosInstance } from "./apiConfig";

// ✅ Create a new garage
export const createGarage = async (garageData) => {
  const response = await axiosInstance.post("/garages", garageData);
  return response.data;
};

// ✅ Get all garages
export const getGarages = async () => {
  const response = await axiosInstance.get("/garages");
  return response.data;
};

// ✅ Get a single garage by ID
export const getGarageById = async (id) => {
  const response = await axiosInstance.get(`/garages/${id}`);
  return response.data;
};

// ✅ Get a single garage by User ID
export const getGarageByUserId = async (userId) => {
  const response = await axiosInstance.get(`/garages/user/${userId}`);
  return response.data;
};

// Get nearby garages by coordinates (new scalable API)
export const findNearbyGarages = async (
  latitude,
  longitude,
  maxDistance = 50,
  limit = 10,
  notifyAll = false,
  name = null,
  phoneNumber = null
) => {
  try {
    const response = await axiosInstance.post("/garages/nearby", {
      latitude,
      longitude,
      maxDistance,
      limit,
      notifyAll,
      name,
      phoneNumber,
    });
    return response.data;
  } catch (error) {
    console.error("Error finding nearby garages:", error);
    throw error;
  }
};

// Send request to a specific garage
export const sendRequestToGarage = async (
  garageId,
  latitude,
  longitude,
  name,
  phoneNumber,
  userFcmToken = null
) => {
  try {
    const response = await axiosInstance.post("/garages/nearest", {
      latitude,
      longitude,
      name,
      phoneNumber,
      selectedGarageId: garageId, // This will be used to target specific garage
      userFcmToken, // Include user's FCM token for reverse notifications
    });
    return response.data;
  } catch (error) {
    console.error("Error sending request to garage:", error);
    throw error;
  }
};

/**
 * Finds the nearest garage to the driver's location and notifies them.
 * This service function now includes the driver's identification details
 * required by the backend controller for notification.
 *
 * @param {number} latitude - Driver's current latitude.
 * @param {number} longitude - Driver's current longitude.
 * @param {string} name - Driver's name (from AsyncStorage).
 * @param {string} phoneNumber - Driver's phone number (from AsyncStorage).
 * @returns {Promise<object>} The response data from the server.
 */
export const findNearestGarage = async (
  latitude,
  longitude,
  name,
  phoneNumber
) => {
  try {
    const response = await axiosInstance.post("/garages/nearest", {
      latitude,
      longitude,
      name, // NEW: Included driver name
      phoneNumber, // NEW: Included driver phone number
    });
    return response.data;
  } catch (error) {
    console.error("Error finding nearest garage:", error);
    // Re-throw the error so the component can handle it
    throw error;
  }
};

// Update a garage
export const updateGarage = async (id, garageData) => {
  const response = await axiosInstance.put(`/garages/${id}`, garageData);
  return response; // <--- Return the full response object
};

// Delete a garage
export const deleteGarage = async (id) => {
  const response = await axiosInstance.delete(`/garages/${id}`);
  return response.data;
};
