import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView, Alert, Platform } from "react-native";
import {
  Text,
  TextInput,
  Button,
  useTheme,
  Card,
  List,
  Divider,
} from "react-native-paper";
// Using MaterialCommunityIcons for consistent mobile icons
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";

// Define a consistent brand color (UPDATED to #4CAF50 - Green)
const BRAND_COLOR = "#4CAF50";

// --- MOCK DATA & HOOK (Simulating Backend Interaction) ---
// Define the mock user object OUTSIDE of the component/hook
const MOCK_USER_DATA = {
  _id: "user_abc_123",
  name: "Jane Doe",
  email: "jane.doe@example.com",
  role: "garageOwner",
  createdAt: "2023-01-15T10:00:00.000Z",
  updatedAt: "2024-05-01T15:30:00.000Z",
};

// Custom hook to simulate fetching user data
const useUserData = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API delay
    const timer = setTimeout(() => {
      // Return a stable mock object reference
      setUser(MOCK_USER_DATA);
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return { user, isLoading };
};
// ---------------------------------------------------------

// Using App as the main component for single-file structure
const App = () => {
  const { colors } = useTheme();
  const { user, isLoading } = useUserData();

  // State for the editable form data
  const [editedUser, setEditedUser] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // 1. Initialize editedUser state only once when the data loads
  useEffect(() => {
    if (user && !hasInitialized) {
      // Create a shallow copy for editing
      setEditedUser({ ...user });
      setHasInitialized(true);
    }
  }, [user, hasInitialized]);

  // Handle input changes
  const handleChange = useCallback((key, value) => {
    setEditedUser((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Handle form submission (Save)
  const handleSave = useCallback(() => {
    // 1. Validation
    if (!editedUser.name || !editedUser.email) {
      Alert.alert("Error", "Name and Email are required fields.");
      return;
    }

    // 2. Mock API Call
    console.log("Saving changes:", editedUser);

    // Mock API success:
    setTimeout(() => {
      Alert.alert("Success", "Profile updated successfully!");
      setIsEditing(false);
    }, 500); // Simulate network delay
  }, [editedUser]);

  // Handle canceling edits
  const handleCancel = useCallback(() => {
    // Revert changes back to the original fetched data
    setEditedUser({ ...user });
    setIsEditing(false);
  }, [user]);

  // Format creation date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  if (isLoading || !hasInitialized) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text variant="headlineMedium">Loading Profile...</Text>
      </View>
    );
  }

  const RoleBadge = ({ role }) => {
    let colorStyle = { color: colors.onSurface };
    let backgroundStyle = { backgroundColor: colors.surfaceVariant };

    if (role === "admin") {
      colorStyle = { color: "white" };
      backgroundStyle = { backgroundColor: "#E53935" }; // Red 600 for admin
    } else if (role === "garageOwner") {
      colorStyle = { color: "white" };
      backgroundStyle = { backgroundColor: BRAND_COLOR }; // Use primary color for main role
    }
    // Default uses the surface variant

    return (
      <View style={[styles.roleBadge, backgroundStyle]}>
        <Text style={[styles.roleText, colorStyle]}>{role.toUpperCase()}</Text>
      </View>
    );
  };

  // --- Render Profile ---
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.headerContainer}>
        <Text
          variant="headlineLarge"
          style={{ color: BRAND_COLOR, fontWeight: "700" }}
        >
          My Profile
        </Text>
        <Button
          mode="contained"
          icon={isEditing ? "close" : "pencil-outline"}
          onPress={() => (isEditing ? handleCancel() : setIsEditing(true))}
          style={[
            styles.editButton,
            { backgroundColor: isEditing ? colors.error : BRAND_COLOR },
          ]}
        >
          {isEditing ? "Cancel" : "Edit"}
        </Button>
      </View>

      <Card style={[styles.infoCard, { backgroundColor: colors.surface }]}>
        <Card.Content>
          {/* User Icon and ID */}
          <View style={styles.avatarContainer}>
            <Icon name="account-circle" size={80} color={BRAND_COLOR} />
            <Text variant="bodySmall" style={styles.userIdText}>
              User ID: {user._id}
            </Text>
          </View>

          <Divider style={styles.cardDivider} />

          {/* 1. Name Field */}
          <View style={styles.fieldRow}>
            <Icon
              name="badge-account-outline"
              size={24}
              color={BRAND_COLOR}
              style={styles.fieldIcon}
            />
            {isEditing ? (
              <TextInput
                label="Full Name"
                value={editedUser.name}
                onChangeText={(text) => handleChange("name", text)}
                style={styles.inputField}
                mode="outlined"
              />
            ) : (
              <List.Item
                title="Name"
                description={editedUser.name}
                titleStyle={{ fontWeight: "bold" }}
                style={styles.viewItem}
              />
            )}
          </View>

          {/* 2. Email Field */}
          <View style={styles.fieldRow}>
            <Icon
              name="email-outline"
              size={24}
              color={BRAND_COLOR}
              style={styles.fieldIcon}
            />
            {isEditing ? (
              <TextInput
                label="Email Address"
                value={editedUser.email}
                onChangeText={(text) => handleChange("email", text)}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.inputField}
                mode="outlined"
              />
            ) : (
              <List.Item
                title="Email"
                description={editedUser.email}
                titleStyle={{ fontWeight: "bold" }}
                style={styles.viewItem}
              />
            )}
          </View>

          <Divider style={styles.cardDivider} />

          {/* 3. Role (Display Only) */}
          <View style={styles.fieldRow}>
            <Icon
              name="account-group-outline"
              size={24}
              color={colors.onSurfaceVariant}
              style={styles.fieldIcon}
            />
            <View style={styles.roleDisplayItem}>
              <Text style={styles.roleTitle}>Role</Text>
              <RoleBadge role={editedUser.role} />
            </View>
          </View>

          {/* 4. Timestamp (Display Only) */}
          <View style={styles.fieldRow}>
            <Icon
              name="clock-check-outline"
              size={24}
              color={colors.onSurfaceVariant}
              style={styles.fieldIcon}
            />
            <List.Item
              title="Member Since"
              description={formatDate(editedUser.createdAt)}
              titleStyle={{ fontWeight: "bold" }}
              style={styles.viewItem}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Security Card */}
      <Card style={[styles.infoCard, { backgroundColor: colors.surface }]}>
        <Card.Title
          title="Security & Password"
          left={(props) => (
            <Icon
              {...props}
              name="lock-outline"
              size={24}
              color={BRAND_COLOR}
            />
          )}
        />
        <Card.Content>
          <Text
            style={{
              marginBottom: 15,
              color: colors.onSurfaceVariant,
              fontSize: 14,
            }}
          >
            Password fields are intentionally hidden for security. Use a
            separate "Change Password" flow.
          </Text>
          <Button
            mode="outlined"
            icon="key-change"
            onPress={() =>
              Alert.alert(
                "Security Action",
                "Redirect to Change Password screen."
              )
            }
            textColor={BRAND_COLOR}
            style={{ borderColor: BRAND_COLOR, borderWidth: 1 }}
          >
            Change Password
          </Button>
        </Card.Content>
      </Card>

      {/* --------------------- Save Button (Visible in Edit Mode) --------------------- */}
      {isEditing && (
        <View style={styles.saveButtonContainer}>
          <Button
            mode="contained"
            icon="content-save-outline"
            onPress={handleSave}
            style={[styles.saveButton, { backgroundColor: BRAND_COLOR }]}
            labelStyle={styles.saveLabel}
          >
            Save Changes
          </Button>
        </View>
      )}

      <View style={{ height: 50 }} />
    </ScrollView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { paddingVertical: 20, paddingHorizontal: 15 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Header
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 5,
    marginBottom: 20,
  },
  editButton: {
    borderRadius: 8,
    paddingHorizontal: 10,
  },

  // Avatar
  avatarContainer: {
    alignItems: "center",
    marginBottom: 10,
    marginTop: 10,
  },
  userIdText: {
    marginTop: 5,
    fontStyle: "italic",
    fontSize: 12,
  },

  // Cards & Fields
  infoCard: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 4,
  },
  cardDivider: { marginVertical: 15 },

  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
    minHeight: 50,
  },
  fieldIcon: {
    paddingRight: 15,
    paddingLeft: 5,
  },
  inputField: {
    flex: 1,
    marginVertical: 5,
    minHeight: 50,
    backgroundColor: "transparent",
  },
  viewItem: {
    flex: 1,
    paddingLeft: 0,
  },

  // Role Badge specific styles for React Native
  roleDisplayItem: {
    flex: 1,
    paddingLeft: 0,
    flexDirection: "column",
    justifyContent: "center",
    paddingVertical: 8,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: "flex-start",
    elevation: 1,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Save Button
  saveButtonContainer: {
    paddingHorizontal: 5,
    marginTop: 20,
  },
  saveButton: {
    width: "100%",
    borderRadius: 8,
    paddingVertical: 5,
  },
  saveLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});

export default App;
