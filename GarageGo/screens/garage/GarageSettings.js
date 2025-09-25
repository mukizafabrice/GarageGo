// screens/SettingsScreen.js
import React, { useState, useContext } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  Image,
} from "react-native";
import {
  Text,
  List,
  Divider,
  Avatar,
  Button,
  useTheme,
} from "react-native-paper";
import { useAuth } from "../../context/AuthContext"; // assuming you have auth context

const SettingsScreen = () => {
  const { colors } = useTheme(); // for dark/light mode
  const { user, logout } = useAuth(); // user info and logout function

  // State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [language, setLanguage] = useState("English");

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const toggleNotifications = () =>
    setNotificationsEnabled(!notificationsEnabled);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Profile Section */}
      <View style={styles.profileContainer}>
        {/* <Avatar.Image
          size={80}
          source={user?.avatar || require("../../assets/avatar.png")}
        /> */}
        <View style={styles.profileText}>
          <Text variant="titleMedium" style={{ color: colors.text }}>
            {user?.name || "Guest User"}
          </Text>
          <Text variant="bodyMedium" style={{ color: colors.text }}>
            {user?.email || "guest@example.com"}
          </Text>
        </View>
      </View>

      <Divider style={{ marginVertical: 10 }} />

      {/* App Settings */}
      <List.Section>
        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, { color: colors.text }]}
        >
          App Settings
        </Text>

        {/* Dark/Light Mode */}
        <List.Item
          title="Dark Mode"
          description="Switch between light and dark theme"
          left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
          right={() => (
            <Switch value={isDarkMode} onValueChange={toggleDarkMode} />
          )}
        />

        {/* Notifications */}
        <List.Item
          title="Notifications"
          description="Enable or disable notifications"
          left={(props) => <List.Icon {...props} icon="bell-ring-outline" />}
          right={() => (
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
            />
          )}
        />

        {/* Language */}
        <List.Item
          title="Language"
          description={language}
          left={(props) => <List.Icon {...props} icon="translate" />}
          onPress={() =>
            Alert.alert("Select Language", "Language picker coming soon")
          }
        />
      </List.Section>

      <Divider style={{ marginVertical: 10 }} />

      {/* Account Settings */}
      <List.Section>
        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, { color: colors.text }]}
        >
          Account
        </Text>

        <List.Item
          title="Change Profile"
          description="Update your personal information"
          left={(props) => (
            <List.Icon {...props} icon="account-circle-outline" />
          )}
          onPress={() =>
            Alert.alert("Update Profile", "Profile update screen coming soon")
          }
        />

        <List.Item
          title="Change Password"
          description="Update your password securely"
          left={(props) => <List.Icon {...props} icon="lock-reset" />}
          onPress={() =>
            Alert.alert("Change Password", "Password change screen coming soon")
          }
        />

        <List.Item
          title="Logout"
          description="Sign out of GarageGo"
          left={(props) => <List.Icon {...props} icon="logout" />}
          onPress={handleLogout}
        />
      </List.Section>

      <Divider style={{ marginVertical: 10 }} />

      {/* App Info */}
      <List.Section>
        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, { color: colors.text }]}
        >
          About
        </Text>
        <List.Item
          title="Version"
          description="1.0.0"
          left={(props) => <List.Icon {...props} icon="information-outline" />}
        />
        <List.Item
          title="Privacy Policy"
          description="Read our privacy policy"
          left={(props) => <List.Icon {...props} icon="shield-lock-outline" />}
          onPress={() =>
            Alert.alert("Privacy Policy", "Policy screen coming soon")
          }
        />
      </List.Section>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileContainer: { flexDirection: "row", alignItems: "center", padding: 20 },
  profileText: { marginLeft: 15 },
  sectionTitle: { marginLeft: 16, marginVertical: 8, fontWeight: "bold" },
});

export default SettingsScreen;
