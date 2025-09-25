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

// garageservice.js

export const findNearestGarage = async (latitude, longitude) => {
  try {
    const response = await axiosInstance.post("/garages/nearest", {
      latitude,
      longitude,
    });
    return response.data;
  } catch (error) {
    console.error("Error finding nearest garage:", error);
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
