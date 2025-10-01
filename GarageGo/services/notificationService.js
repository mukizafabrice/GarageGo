import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Alert, Platform } from "react-native";

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
