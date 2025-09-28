import React, { useState, useEffect, useRef } from "react";
import { View, Text, Button, Platform, Alert } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { useAuth } from "../../context/AuthContext"; // ✅ Import your AuthContext

import { getGarageByUserId, updateGarage } from "../../services/garageService";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function GarageHomeScreen() {
  const { user } = useAuth(); // ✅ Get logged-in user
  const userId = user?._id;
  console.log("Logged-in userId:", userId);
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState(null);
  const [garageId, setGarageId] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  // Fetch garage & register push notifications
  useEffect(() => {
    (async () => {
      if (!userId) {
        console.error("❌ No logged-in user found");
        return;
      }

      // Get the garage linked to this user
      try {
        const response = await getGarageByUserId(userId);
        console.log("Full response from getGarageByUserId:", response);

        const garage = response.data; // ✅ Extract the garage object from response.data
        if (garage && garage._id) {
          console.log("Fetched garage:", garage._id);
          setGarageId(garage._id);
        } else {
          console.error("❌ Garage not found for this user");
        }
      } catch (err) {
        console.error("❌ Failed to fetch garage:", err.message);
      }

      // Get Expo push token
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setExpoPushToken(token);
        console.log("✅ Expo Push Token:", token);
      }
    })();

    // Notification listeners
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notif) =>
        setNotification(notif)
      );

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) =>
        console.log("User tapped notification:", response)
      );

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [userId]);

  // Update backend token when ready
  useEffect(() => {
    if (expoPushToken && garageId) updateTokenToBackend();
  }, [expoPushToken, garageId]);

  const updateTokenToBackend = async () => {
    try {
      const updated = await updateGarage(garageId, { fcmToken: expoPushToken });
      console.log("✅ Backend token update:", updated);
    } catch (err) {
      console.error("❌ Failed to update token:", err.message);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "bold" }}>Expo Push Token:</Text>
      <Text selectable style={{ marginBottom: 20 }}>
        {expoPushToken || "Fetching token..."}
      </Text>

      {notification && (
        <View style={{ marginVertical: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: "bold" }}>
            Latest Notification
          </Text>
          <Text>Title: {notification.request.content.title}</Text>
          <Text>Body: {notification.request.content.body}</Text>
          <Text>Data: {JSON.stringify(notification.request.content.data)}</Text>
        </View>
      )}

      <Button
        title="Send Test Local Notification"
        onPress={async () => {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "📩 Test Notification",
              body: "This is a local test",
              data: { test: "data" },
            },
            trigger: null,
          });
        }}
      />
    </View>
  );
}

// Register for push notifications
async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      Alert.alert("Failed to get push token", "Permission denied!");
      return null;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    Alert.alert(
      "Must use physical device",
      "Push notifications require a device."
    );
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}
