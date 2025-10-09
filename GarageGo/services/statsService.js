import { axiosInstance } from "./apiConfig";

// Base URL for the statistics module, matching the setup in server.js
const STATS_BASE_URL = "/stats";

/**
 * Fetches all aggregated dashboard statistics for a specific garage.
 * @param {string} garageId - The ID of the garage whose data is being requested.
 * @returns {Promise<Object>} A promise that resolves to the structured dashboard data.
 */
export const fetchDashboardStats = async (garageId) => {
  if (!garageId) {
    throw new Error("Garage ID is required to fetch dashboard statistics.");
  }

  try {
    const response = await axiosInstance.get(`${STATS_BASE_URL}/dashboard`, {
      // Pass the garageId as a query parameter
      params: {
        garageId: garageId,
      },
    });

    // The backend returns { success: true, data: {...} }
    return response.data.data;
  } catch (error) {
    console.error(
      "Error fetching dashboard statistics:",
      error.response?.data || error.message
    );
    // Re-throw the structured error from the backend for component handling
    throw error.response?.data || error;
  }
};
