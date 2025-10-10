import { axiosInstance } from "./apiConfig";

/**
 * Fetch count of new requests (SENT_SUCCESS)
 * GET /:garageId/count/new-requests
 */
export const fetchNewRequestsCount = async (garageId) => {
  try {
    const response = await axiosInstance.get(
      `/stats/${garageId}/count/new-requests`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching new requests count:", error);
    throw error;
  }
};

/**
 * Fetch count of active jobs (GARAGE_ACCEPTED)
 * GET /:garageId/count/active-jobs
 */
export const fetchActiveJobsCount = async (garageId) => {
  try {
    const response = await axiosInstance.get(
      `/stats/${garageId}/count/active-jobs`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching active jobs count:", error);
    throw error;
  }
};

/**
 * Fetch garage acceptance rate
 * GET /:garageId/acceptance-rate
 */
export const fetchAcceptanceRate = async (garageId) => {
  try {
    const response = await axiosInstance.get(
      `/stats/${garageId}/acceptance-rate`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching acceptance rate:", error);
    throw error;
  }
};

/**
 * Fetch notifications sent successfully in last 24 hours
 * GET /:garageId/sent-success
 */
export const fetchSentSuccessNotifications = async (garageId) => {
  try {
    const response = await axiosInstance.get(`/stats/${garageId}/sent-success`);
    return response.data;
  } catch (error) {
    console.error("Error fetching sent-success notifications:", error);
    throw error;
  }
};

/**
 * Fetch garage accepted notifications in last 24 hours
 * GET /:garageId/garage-accepted
 */
export const fetchGarageAcceptedNotifications = async (garageId) => {
  try {
    const response = await axiosInstance.get(
      `/stats/${garageId}/garage-accepted`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching garage-accepted notifications:", error);
    throw error;
  }
};

/**
 * Fetch service completed notifications in last 24 hours
 * GET /:garageId/service-completed
 */
export const fetchServiceCompletedNotifications = async (garageId) => {
  try {
    const response = await axiosInstance.get(
      `/stats/${garageId}/service-completed`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching service-completed notifications:", error);
    throw error;
  }
};

/**
 * Update a notification's status to GARAGE_ACCEPTED or GARAGE_DECLINED
 * @param {string} notificationId - The ID of the notification
 * @param {"GARAGE_ACCEPTED" | "GARAGE_DECLINED"} status - The new status
 * @returns Updated notification data
 */
export const updateNotificationStatus = async (id, notificationStatus) => {
  try {
    const response = await axiosInstance.put(`/stats/${id}/status`, {
      notificationStatus,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating notification status:", error);
    throw error;
  }
};
