import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Provider as PaperProvider } from "react-native-paper"; // <-- Add this import
import { AuthProvider, useAuth } from "./context/AuthContext";
import RootNavigator from "./navigation/RootNavigator";

import {
  requestUserPermission,
  listenToForegroundMessages,
  handleBackgroundMessages,
  handleNotificationOpenedApp,
} from "./services/notificationService";

const AppContent = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <RootNavigator />;
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
    <PaperProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});

export default App;
