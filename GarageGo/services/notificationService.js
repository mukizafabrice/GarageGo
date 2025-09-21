import messaging from "@react-native-firebase/messaging";
import { Alert, Platform } from "react-native";

export const requestUserPermission = async () => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log("Authorization status:", authStatus);
    const fcmToken = await messaging().getToken();
    console.log("FCM Token:", fcmToken);
    return fcmToken; // send this to backend
  } else {
    console.log("FCM permission denied");
  }
};

export const listenToForegroundMessages = () => {
  messaging().onMessage(async (remoteMessage) => {
    Alert.alert("New Notification", remoteMessage.notification?.body || "");
  });
};

export const handleBackgroundMessages = async () => {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log("Background message:", remoteMessage);
  });
};

export const handleNotificationOpenedApp = () => {
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log(
      "Notification caused app to open from background:",
      remoteMessage
    );
  });

  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log(
          "Notification caused app to open from quit state:",
          remoteMessage
        );
      }
    });
};
