import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Alert, Platform } from "react-native";
import { axiosInstance } from "./apiConfig";

// --- Configuration ---
const NOTIFICATION_BASE_URL = "/notifications";

// --- Permissions and Tokens ---

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
    return null; // Return null if not on a physical device
  }
};

// --- Listeners (App Foreground/Interaction) ---

export const listenToForegroundMessages = () => {
  const subscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      // This simple listener only shows an alert when the app is foregrounded.
      // The main screen (e.g., GarageMapScreen) should implement the logic
      // to call updateNotificationStatus('id', 'SENT_RECEIVED') if needed.
      Alert.alert("New Notification", notification.request.content.body || "");
    }
  );

  return subscription;
};

export const handleNotificationOpenedApp = () => {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log("Notification clicked:", response);
    }
  );

  return subscription;
};

// --- CRUD Operations ---

export const getAllNotifications = async () => {
  try {
    const response = await axiosInstance.get(NOTIFICATION_BASE_URL);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getNotificationById = async (id) => {
  try {
    const response = await axiosInstance.get(`${NOTIFICATION_BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getNotificationsByGarageId = async (garageId) => {
  try {
    const response = await axiosInstance.get(
      `${NOTIFICATION_BASE_URL}/garage/${garageId}`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Updates the notification status on the backend.
 * This is used for simple status updates like 'SENT_RECEIVED'.
 *
 * NOTE: The backend controller expects the status in the body under the key 'newStatus'.
 *
 * @param {string} id - The notification ID.
 * @param {string} statusValue - The new status (e.g., 'SENT_RECEIVED').
 */
export const updateNotificationStatus = async (id, statusValue) => {
  try {
    const response = await axiosInstance.put(`${NOTIFICATION_BASE_URL}/${id}`, {
      newStatus: statusValue, // CORRECTED: Send as 'newStatus'
    });
    return response.data;
  } catch (error) {
    // Re-throw the structured error from the backend (e.g., "Missing newStatus field")
    throw error.response?.data || error;
  }
};

/**
 * Updates the notification status using the dynamic action route (e.g., /:id/accept).
 * This is used for driver actions like ACCEPT, DECLINE, COMPLETE.
 */
export const updateNotificationStatusAction = async (id, action) => {
  const validActions = ["accept", "decline", "complete"];
  if (!validActions.includes(action.toLowerCase())) {
    throw new Error(
      "Invalid action. Must be one of: accept, decline, complete."
    );
  }

  try {
    const { data } = await axiosInstance.put(
      `${NOTIFICATION_BASE_URL}/${id}/${action}`
    );
    return data;
  } catch (error) {
    console.error(
      "Error updating notification status:",
      error.response?.data || error.message
    );
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
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteAllNotifications = async () => {
  try {
    const response = await axiosInstance.delete(NOTIFICATION_BASE_URL);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
export const fetchLiveNotifications = async (garageId) => {
  if (!garageId) {
    // Return an empty array or throw an error if the garage ID is missing
    console.warn("Garage ID is missing. Cannot fetch live notifications.");
    return [];
  }

  try {
    const response = await axiosInstance.get(`${NOTIFICATION_BASE_URL}/live`, {
      params: {
        garageId: garageId,
      },
    });

    // Assuming the backend returns the list of notifications under response.data.data
    return response.data.data;
  } catch (error) {
    console.error(
      "Error fetching live notifications:",
      error.response?.data || error.message
    );
    // Propagate the error to be handled in the component
    throw error.response?.data || error;
  }
};

// NEW: Function to get user's FCM token from AsyncStorage
export const getStoredFCMToken = async () => {
  try {
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    const token = await AsyncStorage.getItem("user_fcm_token");
    return token;
  } catch (error) {
    console.error("Error getting stored FCM token:", error);
    return null;
  }
};
