import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider, useAuth } from "./context/AuthContext";

import AuthNavigator from "./navigation/AuthNavigator";
import AppNavigator from "./navigation/AppNavigator";

import {
  requestUserPermission,
  listenToForegroundMessages,
  handleBackgroundMessages,
  handleNotificationOpenedApp,
} from "./services/notificationService";

const RootNavigation = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const App = () => {
  useEffect(() => {
    const initFCM = async () => {
      const token = await requestUserPermission();
      console.log("FCM Token:", token);

      listenToForegroundMessages();
      handleBackgroundMessages();
      handleNotificationOpenedApp();
    };
    initFCM();
  }, []);

  return (
    <AuthProvider>
      <RootNavigation />
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});

export default App;
