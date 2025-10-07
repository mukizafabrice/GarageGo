import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, StyleSheet, ScrollView, Alert, Platform } from "react-native";
import {
  Text,
  TextInput, // For editing fields
  Button,
  useTheme,
  Card,
  List,
  Chip, // For displaying/editing services
  Divider,
} from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons"; // Paper uses MC icons

// Define Brand Color (Consistent with SettingsScreen)
const PRIMARY_COLOR = "#4CAF50";

// --- PLACEHOLDER DATA & HOOK ---
// NOTE: Moving the mock object definition OUTSIDE of the hook/component
// ensures the object reference is stable and only created once.
const MOCK_GARAGE_DATA = {
  _id: "garage_123",
  name: "Auto-Revive Garage & Service Center",
  description:
    "Your trusted local mechanics for all makes and models. We specialize in engine diagnostics and quick oil changes.",
  latitude: 34.0522, // Los Angeles example
  longitude: -118.2437,
  address: "123 Workshop Lane, Downtown, CA 90012",
  phone: "(555) 555-1234",
  services: [
    "Oil Change",
    "Brake Repair",
    "Tire Rotation",
    "Engine Diagnostics",
  ],
  userId: ["user_abc", "user_def"], // Staff linked
};

const useGarageData = () => {
  // In a real app, you would fetch from an API.
  // Here, we return the stable object and simulate loading.
  return { garage: MOCK_GARAGE_DATA, isLoading: false };
};
// ---------------------------------

const GarageProfileScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { garage, isLoading } = useGarageData();

  // FIX: Initialize editedGarage state only when 'garage' is available and stable.
  // We use useMemo with the 'garage' dependency to create a stable object for initial state.
  // Although the object reference from useGarageData is stable now (because it's defined outside),
  // this pattern is robust for when fetching dynamic data.

  // 1. Initialize with an empty object and a flag
  const [editedGarage, setEditedGarage] = useState({});
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Only run this initialization logic once when garage is loaded/available.
    if (garage && !hasInitialized) {
      // Deep copy the garage object to isolate state changes for editing
      setEditedGarage({ ...garage });
      setHasInitialized(true); // Prevent future runs
    }
  }, [garage, hasInitialized]); // Still depend on 'garage' and 'hasInitialized'

  // The primary fix in a real-world scenario is ensuring `useGarageData`
  // returns a stable object, which we did by defining MOCK_GARAGE_DATA outside.
  // The useEffect/hasInitialized pattern is the robust way to handle dynamic
  // data that may take time to load (where isLoading is true initially).

  // Memoize handleChange to avoid unnecessary re-renders in deep components (good practice)
  const handleChange = useCallback((key, value) => {
    setEditedGarage((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Handle saving changes
  const handleSave = useCallback(() => {
    // 1. **Validation**: Check if required fields (name, lat, lon) are present.
    if (
      !editedGarage.name ||
      !editedGarage.latitude ||
      !editedGarage.longitude
    ) {
      Alert.alert(
        "Error",
        "Name, Latitude, and Longitude are required fields."
      );
      return;
    }

    // 2. **API Call**: Send `editedGarage` data to your backend API.
    console.log("Saving changes:", editedGarage);

    // Placeholder for actual save logic
    setTimeout(() => {
      Alert.alert("Success", "Garage profile updated successfully!");
      setIsEditing(false);
    }, 500); // Simulate network delay
  }, [editedGarage]);

  const handleCancel = useCallback(() => {
    // Revert changes and exit editing mode: set editedGarage back to the source data
    setEditedGarage({ ...garage });
    setIsEditing(false);
  }, [garage]);

  // Placeholder function for adding a new service
  const handleAddService = () => {
    Alert.prompt(
      "Add New Service",
      "Enter the name of the new service:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add",
          onPress: (service) => {
            if (service && !editedGarage.services.includes(service.trim())) {
              setEditedGarage((prev) => ({
                ...prev,
                services: [...(prev.services || []), service.trim()],
              }));
            }
          },
        },
      ],
      "plain-text"
    );
  };

  // Function to remove a service
  const handleRemoveService = useCallback((serviceToRemove) => {
    setEditedGarage((prev) => {
      const updatedServices = (prev.services || []).filter(
        (s) => s !== serviceToRemove
      );
      return { ...prev, services: updatedServices };
    });
  }, []);

  if (isLoading || !hasInitialized) {
    // Check hasInitialized instead of just 'garage'
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text variant="headlineMedium">Loading Garage Data...</Text>
      </View>
    );
  }

  // --- Render Logic ---
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.headerContainer}>
        <Text variant="headlineMedium" style={{ color: colors.onSurface }}>
          {isEditing ? "Edit Garage Profile" : editedGarage.name}
        </Text>
        <Button
          mode="contained"
          icon={isEditing ? "close" : "pencil-outline"}
          onPress={() => (isEditing ? handleCancel() : setIsEditing(true))}
          style={[
            styles.editButton,
            { backgroundColor: isEditing ? colors.error : PRIMARY_COLOR },
          ]}
        >
          {isEditing ? "Cancel Edit" : "Edit Profile"}
        </Button>
      </View>

      <Divider style={styles.mainDivider} />

      {/* --------------------- 1. Basic Info Card --------------------- */}
      <Card style={[styles.infoCard, { backgroundColor: colors.surface }]}>
        <Card.Title
          title="Basic Information"
          left={(props) => (
            <Icon
              {...props}
              name="information-outline"
              size={24}
              color={PRIMARY_COLOR}
            />
          )}
        />
        <Card.Content>
          {/* Garage Name */}
          <View style={styles.fieldRow}>
            <Icon
              name="garage-open"
              size={20}
              color={colors.onSurfaceVariant}
              style={styles.fieldIcon}
            />
            {isEditing ? (
              <TextInput
                label="Garage Name (Required)"
                value={editedGarage.name}
                onChangeText={(text) => handleChange("name", text)}
                style={styles.inputField}
                mode="outlined"
              />
            ) : (
              <List.Item
                title="Name"
                description={editedGarage.name}
                style={styles.viewItem}
              />
            )}
          </View>

          {/* Description */}
          <View style={styles.fieldRow}>
            <Icon
              name="text-box-multiple-outline"
              size={20}
              color={colors.onSurfaceVariant}
              style={styles.fieldIcon}
            />
            {isEditing ? (
              <TextInput
                label="Description"
                value={editedGarage.description}
                onChangeText={(text) => handleChange("description", text)}
                multiline
                numberOfLines={3}
                style={[styles.inputField, { height: 100 }]}
                mode="outlined"
              />
            ) : (
              <List.Item
                title="Description"
                description={
                  editedGarage.description || "No description provided."
                }
                descriptionNumberOfLines={3}
                style={styles.viewItem}
              />
            )}
          </View>

          {/* Phone */}
          <View style={styles.fieldRow}>
            <Icon
              name="phone-outline"
              size={20}
              color={colors.onSurfaceVariant}
              style={styles.fieldIcon}
            />
            {isEditing ? (
              <TextInput
                label="Phone Number"
                value={editedGarage.phone}
                onChangeText={(text) => handleChange("phone", text)}
                keyboardType="phone-pad"
                style={styles.inputField}
                mode="outlined"
              />
            ) : (
              <List.Item
                title="Phone"
                description={editedGarage.phone || "N/A"}
                style={styles.viewItem}
              />
            )}
          </View>

          {/* Address */}
          <View style={styles.fieldRow}>
            <Icon
              name="map-marker-outline"
              size={20}
              color={colors.onSurfaceVariant}
              style={styles.fieldIcon}
            />
            {isEditing ? (
              <TextInput
                label="Street Address"
                value={editedGarage.address}
                onChangeText={(text) => handleChange("address", text)}
                style={styles.inputField}
                mode="outlined"
              />
            ) : (
              <List.Item
                title="Address"
                description={editedGarage.address || "No address set."}
                style={styles.viewItem}
              />
            )}
          </View>
        </Card.Content>
      </Card>

      <Divider style={styles.mainDivider} />

      {/* --------------------- 2. Location & Services Card --------------------- */}
      <Card style={[styles.infoCard, { backgroundColor: colors.surface }]}>
        <Card.Title
          title="Location & Services"
          left={(props) => (
            <Icon
              {...props}
              name="map-search-outline"
              size={24}
              color={PRIMARY_COLOR}
            />
          )}
        />
        <Card.Content>
          {/* Map Placeholder/GPS Coords */}
          <Text variant="titleMedium" style={styles.subTitle}>
            GPS Coordinates (Required)
          </Text>
          <View style={styles.mapPlaceholder}>
            {/* NOTE: In a real app, use a library like 'react-native-maps' here. */}
            <Icon name="map" size={50} color={colors.backdrop} />
            <Text style={{ color: colors.onSurfaceVariant }}>
              Map Preview Placeholder
            </Text>
          </View>

          <View style={styles.coordinateRow}>
            {/* Latitude */}
            <View style={styles.coordinateField}>
              {isEditing ? (
                <TextInput
                  label="Latitude"
                  value={String(editedGarage.latitude)}
                  onChangeText={(text) =>
                    handleChange("latitude", Number(text) || 0)
                  }
                  keyboardType="numeric"
                  style={styles.inputField}
                  mode="outlined"
                  dense
                />
              ) : (
                <Text variant="bodyLarge">Lat: {editedGarage.latitude}</Text>
              )}
            </View>

            {/* Longitude */}
            <View style={styles.coordinateField}>
              {isEditing ? (
                <TextInput
                  label="Longitude"
                  value={String(editedGarage.longitude)}
                  onChangeText={(text) =>
                    handleChange("longitude", Number(text) || 0)
                  }
                  keyboardType="numeric"
                  style={styles.inputField}
                  mode="outlined"
                  dense
                />
              ) : (
                <Text variant="bodyLarge">Lon: {editedGarage.longitude}</Text>
              )}
            </View>
          </View>

          <Divider style={styles.innerDivider} />

          {/* Services Offered */}
          <View>
            <Text variant="titleMedium" style={styles.subTitle}>
              Services Offered
            </Text>
            <View style={styles.servicesContainer}>
              {editedGarage.services &&
                editedGarage.services.map((service, index) => (
                  <Chip
                    key={service + index} // Use service name and index for key
                    icon="check-circle"
                    onClose={
                      isEditing ? () => handleRemoveService(service) : undefined
                    }
                    mode={isEditing ? "outlined" : "flat"}
                    style={[
                      styles.serviceChip,
                      {
                        backgroundColor: isEditing
                          ? colors.surface
                          : PRIMARY_COLOR + "10",
                      },
                    ]}
                    textStyle={{
                      color: isEditing ? colors.onSurface : PRIMARY_COLOR,
                    }}
                  >
                    {service}
                  </Chip>
                ))}
              {isEditing && (
                <Chip
                  icon="plus-circle-outline"
                  onPress={handleAddService}
                  style={[
                    styles.serviceChip,
                    { borderColor: PRIMARY_COLOR, borderWidth: 1 },
                  ]}
                  textStyle={{ color: PRIMARY_COLOR }}
                  mode="outlined"
                >
                  Add Service
                </Chip>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* --------------------- 3. Save Button (Visible in Edit Mode) --------------------- */}
      {isEditing && (
        <View style={styles.saveButtonContainer}>
          <Button
            mode="contained"
            icon="content-save-outline"
            onPress={handleSave}
            style={[styles.saveButton, { backgroundColor: PRIMARY_COLOR }]}
            labelStyle={styles.saveLabel}
          >
            Save Changes
          </Button>
        </View>
      )}
    </ScrollView>
  );
};

// --- Styles (No changes needed here, copied from original) ---
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
    marginBottom: 10,
  },
  editButton: {
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  mainDivider: { marginVertical: 15 },

  // Cards & Fields
  infoCard: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 2,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Platform.OS === "ios" ? 10 : 0,
  },
  fieldIcon: {
    paddingRight: 15,
    paddingLeft: 5,
    alignSelf: "flex-start",
    marginTop: 18,
  },
  inputField: {
    flex: 1,
    marginVertical: 5,
    minHeight: 50,
  },
  viewItem: {
    flex: 1,
    paddingLeft: 0,
  },
  innerDivider: { marginVertical: 20 },
  subTitle: {
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 10,
  },

  // Map/Coordinates
  mapPlaceholder: {
    height: 150,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: PRIMARY_COLOR,
    marginVertical: 10,
  },
  coordinateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  coordinateField: {
    width: "48%",
  },

  // Services
  servicesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 5,
  },
  serviceChip: {
    margin: 4,
  },

  // Save Button
  saveButtonContainer: {
    paddingHorizontal: 5,
    marginTop: 10,
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

export default GarageProfileScreen;
