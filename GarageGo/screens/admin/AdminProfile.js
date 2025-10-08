import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Text,
  TextInput,
  Button,
  useTheme,
  Card,
  List,
  Divider,
  ActivityIndicator, // Used for loading states
} from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";

// Assuming these are implemented and working to call your actual backend
import { fetchUserById, updateUser } from "../../services/AuthService";
import { useAuth } from "../../context/AuthContext";

const BRAND_COLOR = "#4CAF50";

const Profile = ({ navigation }) => {
  const { colors } = useTheme();

  // FIX APPLIED HERE (Confirmed):
  // 1. Get user object (user) and alias it to authUser.
  // 2. Get the context update function (updateUser) and alias it to setAuthUser.
  const { user: authUser, updateUser: setAuthUser } = useAuth();
  const userId = authUser?._id;

  // Local state for the full profile data fetched from the API (Source of Truth)
  const [myProfile, setMyProfile] = useState(null);
  // State for the editable form data
  const [editedUser, setEditedUser] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  // State for initial screen loading
  const [isLoading, setIsLoading] = useState(true);
  // State for button saving
  const [isSaving, setIsSaving] = useState(false);

  // --- Data Fetching Logic ---
  const fetchUserProfile = useCallback(async () => {
    if (!userId) {
      console.log("No userId available. User may be logged out.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Use the real fetch service with the derived userId
      const response = await fetchUserById(userId);

      if (response && response.success) {
        const userData = response.data;
        // Set the fetched data as the source of truth
        setMyProfile(userData);
        // Initialize the editable state
        setEditedUser({ ...userData });
      } else {
        Alert.alert(
          "Error",
          response?.message || "Failed to fetch user profile."
        );
      }
    } catch (error) {
      Alert.alert("Error", "Network error. Failed to fetch user profile.");
      console.error("Fetch User Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Fetch data on component mount or when userId changes
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // --- Edit Handlers ---
  const handleChange = useCallback((key, value) => {
    setEditedUser((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    // 1. Validation
    if (!editedUser.name || !editedUser.email) {
      Alert.alert("Error", "Name and Email are required fields.");
      return;
    }

    setIsSaving(true);
    try {
      // 2. Real API Call
      const payload = {
        name: editedUser.name,
        email: editedUser.email,
      };

      const response = await updateUser(userId, payload);

      if (response && response.success) {
        const updatedData = response.data;

        // 3. Update the local source of truth
        setMyProfile(updatedData);

        // 4. Update the global AuthContext state using the aliased function
        // This line now correctly calls context.updateUser(updatedData)
        setAuthUser(updatedData);

        Alert.alert("Success", "Profile updated successfully!");
        setIsEditing(false);
      } else {
        Alert.alert("Error", response?.message || "Failed to update profile.");
      }
    } catch (error) {
      Alert.alert("Error", "Network error. Failed to save changes.");
      console.error("Update User Error:", error);
    } finally {
      setIsSaving(false);
    }
  }, [userId, editedUser, setAuthUser]);

  const handleCancel = useCallback(() => {
    // Revert changes back to the last fetched data (myProfile)
    if (myProfile) {
      setEditedUser({ ...myProfile });
    }
    setIsEditing(false);
  }, [myProfile]);

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

  // --- Loading State Display ---
  if (isLoading || !myProfile) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={BRAND_COLOR} />
        <Text variant="headlineSmall" style={{ marginTop: 15 }}>
          Loading Profile...
        </Text>
      </View>
    );
  }

  // --- Role Badge Component ---
  const RoleBadge = ({ role }) => {
    let colorStyle = { color: colors.onSurface };
    let backgroundStyle = { backgroundColor: colors.surfaceVariant };

    if (role === "admin") {
      colorStyle = { color: "white" };
      backgroundStyle = { backgroundColor: "#E53935" };
    } else if (role === "garageOwner") {
      colorStyle = { color: "white" };
      backgroundStyle = { backgroundColor: BRAND_COLOR };
    }

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
      {/* Header and Edit/Cancel Button */}
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
              User ID: {myProfile._id}
            </Text>
          </View>

          <Divider style={styles.cardDivider} />

          {/* 1. Name Field (Editable/View) */}
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
                value={editedUser.name} // Use editable state for input
                onChangeText={(text) => handleChange("name", text)}
                style={styles.inputField}
                mode="outlined"
              />
            ) : (
              <List.Item
                title="Name"
                description={myProfile.name} // Use source of truth for view
                titleStyle={{ fontWeight: "bold" }}
                style={styles.viewItem}
              />
            )}
          </View>

          {/* 2. Email Field (Editable/View) */}
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
                value={editedUser.email} // Use editable state for input
                onChangeText={(text) => handleChange("email", text)}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.inputField}
                mode="outlined"
              />
            ) : (
              <List.Item
                title="Email"
                description={myProfile.email} // Use source of truth for view
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
              <RoleBadge role={myProfile.role} />
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
              description={formatDate(myProfile.createdAt)}
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
            onPress={() => navigation.navigate("ChangePassword")}
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
            loading={isSaving}
            disabled={isSaving}
            style={[styles.saveButton, { backgroundColor: BRAND_COLOR }]}
            labelStyle={styles.saveLabel}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </View>
      )}

      <View style={{ height: 50 }} />
    </ScrollView>
  );
};

// --- Styles (Unchanged) ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { paddingVertical: 20, paddingHorizontal: 15 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
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

export default Profile;
