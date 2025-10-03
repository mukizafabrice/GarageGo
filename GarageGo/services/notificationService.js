import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Alert, Platform } from "react-native";
import { axiosInstance } from "./apiConfig";

export const requestUserPermission = async () => {
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Permission not granted!");
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("Expo Push Token:", token);
    return token; // Send to your backend
  } else {
    Alert.alert("Must use physical device for Push Notifications");
  }
};

export const listenToForegroundMessages = () => {
  const subscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      Alert.alert("New Notification", notification.request.content.body || "");
    }
  );

  // Return the subscription object so the caller can clean it up
  return subscription;
};

// Notifications.addNotificationResponseReceivedListener returns a Subscription object
export const handleNotificationOpenedApp = () => {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log("Notification clicked:", response);
    }
  );

  // Return the subscription object so the caller can clean it up
  return subscription;
};

//notification crud operations

const NOTIFICATION_BASE_URL = "/notifications";

export const getAllNotifications = async () => {
  try {
    const response = await axiosInstance.get(NOTIFICATION_BASE_URL);
    return response.data; // Includes success, count, and data array
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Retrieves a single notification log by its ID.
 * @param {string} id - The MongoDB ObjectId of the notification log.
 * @returns {Promise<Object>} A promise that resolves to a single notification object.
 */
export const getNotificationById = async (id) => {
  try {
    const response = await axiosInstance.get(`${NOTIFICATION_BASE_URL}/${id}`);
    return response.data; // Includes success and data object
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getNotificationsByGarageId = async (garageId) => {
  try {
    const response = await axiosInstance.get(
      `${NOTIFICATION_BASE_URL}/garage/${garageId}`
    );
    return response.data; // Includes success, count, and data array
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateNotificationStatus = async (id, updateData) => {
  try {
    const response = await axiosInstance.put(
      `${NOTIFICATION_BASE_URL}/${id}`,
      updateData
    );
    return response.data; // Includes success and updated data object
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteNotification = async (id) => {
  try {
    const response = await axiosInstance.delete(
      `${NOTIFICATION_BASE_URL}/${id}`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteNotificationsByGarageId = async (garageId) => {
  try {
    const response = await axiosInstance.delete(
      `${NOTIFICATION_BASE_URL}/garage/${garageId}`
    );
    return response.data; // Includes success and deletedCount
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteAllNotifications = async () => {
  try {
    const response = await axiosInstance.delete(NOTIFICATION_BASE_URL);
    return response.data; // Includes success and deletedCount
  } catch (error) {
    throw error.response?.data || error;
  }
};
