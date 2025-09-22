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
  Notifications.addNotificationReceivedListener((notification) => {
    Alert.alert("New Notification", notification.request.content.body || "");
  });
};

export const handleNotificationOpenedApp = () => {
  Notifications.addNotificationResponseReceivedListener((response) => {
    console.log("Notification clicked:", response);
  });
};
