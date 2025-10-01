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

// Get nearby garages by coordinates
export const getNearbyGarages = async (lat, lng, radius = 5000) => {
  const response = await axiosInstance.get("/garages/nearby", {
    params: { lat, lng, radius },
  });
  return response.data;
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
  return response.data;
};

// Delete a garage
export const deleteGarage = async (id) => {
  const response = await axiosInstance.delete(`/garages/${id}`);
  return response.data;
};
