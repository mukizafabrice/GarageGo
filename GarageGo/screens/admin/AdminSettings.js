import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  List,
  Divider,
  Avatar,
  Button,
  useTheme,
  Card, // Import Card for the profile section
} from "react-native-paper";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons"; // For extra icons

// Define Brand Color
const PRIMARY_COLOR = "#4CAF50";

const SettingsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user, logout } = useAuth(); // user info and logout function

  // State
  // NOTE: In a real app, these states (isDarkMode) would typically be managed by a global theme context
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [language, setLanguage] = useState("English");

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const toggleNotifications = () =>
    setNotificationsEnabled(!notificationsEnabled);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to sign out of GarageGo?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  const handleNavigation = (screen, alertTitle) => {
    // In a real app, you would use navigation.navigate(screen);
    Alert.alert(alertTitle, `${alertTitle} screen coming soon`);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* --------------------- 1. Elevated Profile Card --------------------- */}
      <Card style={[styles.profileCard, { backgroundColor: colors.surface }]}>
        <View style={styles.profileCardContent}>
          {/* Avatar Area */}
          <Avatar.Icon
            size={70}
            icon="car-wrench" // Use a relevant icon since avatar source is commented
            style={{ backgroundColor: PRIMARY_COLOR }}
            color="#FFFFFF"
          />
          <View style={styles.profileText}>
            <Text
              variant="titleLarge"
              style={[styles.userName, { color: colors.onSurface }]}
            >
              {user?.name || "GarageGo User"}
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: colors.onSurfaceVariant }}
            >
              {user?.email || "user@garagego.com"}
            </Text>
          </View>
        </View>

        {/* Action Button for Profile */}
        <Button
          mode="outlined"
          icon="account-edit-outline"
          onPress={() => navigation.navigate("AdminProfile")}
          labelStyle={{ color: PRIMARY_COLOR }}
          style={styles.manageAccountButton}
        >
          Manage Account
        </Button>
      </Card>

      <Divider style={styles.sectionDivider} />

      {/* --------------------- 2. App Preferences --------------------- */}
      <List.Section
        title="APP PREFERENCES"
        titleStyle={styles.sectionTitleStyle}
      >
        {/* Dark/Light Mode */}
        <List.Item
          title="Dark Mode"
          description="Switch between light and dark theme"
          left={(props) => (
            <List.Icon
              {...props}
              icon="theme-light-dark"
              color={PRIMARY_COLOR}
            />
          )}
          right={() => (
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              color={PRIMARY_COLOR}
            />
          )}
          style={styles.listItem}
        />

        {/* Notifications */}
        <List.Item
          title="Notifications"
          description="Enable or disable push notifications"
          left={(props) => (
            <List.Icon
              {...props}
              icon="bell-ring-outline"
              color={PRIMARY_COLOR}
            />
          )}
          right={() => (
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              color={PRIMARY_COLOR}
            />
          )}
          style={styles.listItem}
        />

        {/* Language */}
        <List.Item
          title="Language"
          description={language}
          left={(props) => (
            <List.Icon {...props} icon="translate" color={PRIMARY_COLOR} />
          )}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => handleNavigation("LanguageSelect", "Select Language")}
          style={styles.listItem}
        />
      </List.Section>

      <Divider style={styles.sectionDivider} />

      {/* --------------------- 3. Security and Legal --------------------- */}
      <List.Section
        title="SECURITY & LEGAL"
        titleStyle={styles.sectionTitleStyle}
      >
        {/* Change Password */}
        {/* <List.Item
          title="Change Password"
          description="Update your password securely"
          left={(props) => (
            <List.Icon {...props} icon="lock-reset" color={PRIMARY_COLOR} />
          )}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate("ChangePassword")}
          style={styles.listItem}
        /> */}

        {/* Privacy Policy */}
        <List.Item
          title="Privacy Policy"
          description="Read our terms and data usage"
          left={(props) => (
            <List.Icon
              {...props}
              icon="shield-lock-outline"
              color={PRIMARY_COLOR}
            />
          )}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate("Privacy")}
          style={styles.listItem}
        />

        {/* Help & Support */}
        <List.Item
          title="Help & Support"
          description="Get answers to common questions"
          left={(props) => (
            <List.Icon
              {...props}
              icon="help-circle-outline"
              color={PRIMARY_COLOR}
            />
          )}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate("Help")}
          style={styles.listItem}
        />
        <List.Item
          title="Manage Notifications"
          description="View and manage stored notifications"
          left={(props) => (
            <List.Icon
              {...props}
              icon="bell-cog-outline"
              color={PRIMARY_COLOR}
            />
          )}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate("NotificationAdmin")}
          style={styles.listItem}
        />
      </List.Section>

      <Divider style={styles.sectionDivider} />

      {/* --------------------- 4. Logout and Version --------------------- */}
      <View style={styles.footerContainer}>
        {/* Logout Button */}
        <Button
          mode="contained"
          icon="logout"
          onPress={handleLogout}
          style={styles.logoutButton}
          contentStyle={styles.logoutContent}
          labelStyle={styles.logoutLabel}
        >
          Sign Out
        </Button>

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <Text style={{ color: colors.onSurfaceVariant }}>
            GarageGo App Version 1.0.0
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { paddingBottom: 40 },

  // Profile Card Styles
  profileCard: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileCardContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15, // Space between info and button
  },
  profileText: {
    marginLeft: 15,
    flexShrink: 1, // Ensures text wraps if too long
  },
  userName: {
    fontWeight: "bold",
  },
  manageAccountButton: {
    borderColor: PRIMARY_COLOR,
    borderRadius: 8,
  },

  // Section Styles
  sectionDivider: { marginHorizontal: 20, marginVertical: 10 },
  sectionTitleStyle: {
    marginLeft: 20,
    fontWeight: "bold",
    fontSize: 14,
    color: PRIMARY_COLOR, // Highlight section titles with brand color
    marginTop: 10,
  },
  listItem: {
    paddingHorizontal: 5,
  },

  // Footer Styles
  footerContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    alignItems: "center",
  },
  logoutButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 8,
    width: "100%",
    marginVertical: 10,
  },
  logoutContent: {
    paddingVertical: 5,
  },
  logoutLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  versionContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
});

export default SettingsScreen;
