import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Button,
  useTheme,
  Card,
  Divider,
  ActivityIndicator,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

// Define Brand Color
const PRIMARY_COLOR = "#4CAF50";

// Mock data structure based on models/Garage.js
const mockGarageData = {
  name: "Smith's Auto Repair",
  description: "Full-service auto repair shop specializing in European cars.",
  latitude: 34.0522,
  longitude: -118.2437,
  address: "123 Main St, Anytown, CA 90012",
  phone: "(555) 555-0100",
  services: [
    "Oil Change",
    "Brake Repair",
    "Engine Diagnostics",
    "Tire Rotation",
  ],
};

const allAvailableServices = [
  "Oil Change",
  "Brake Repair",
  "Tire Rotation",
  "Engine Diagnostics",
  "Transmission Repair",
  "A/C Service",
  "Alignment",
  "Towing",
];

const GarageProfileScreen = ({ navigation }) => {
  const { colors } = useTheme();

  // State initialization using mock data
  const [garageName, setGarageName] = useState(mockGarageData.name);
  const [description, setDescription] = useState(mockGarageData.description);
  const [address, setAddress] = useState(mockGarageData.address);
  const [phone, setPhone] = useState(mockGarageData.phone);
  const [latitude, setLatitude] = useState(String(mockGarageData.latitude));
  const [longitude, setLongitude] = useState(String(mockGarageData.longitude));
  const [selectedServices, setSelectedServices] = useState(
    mockGarageData.services
  );
  const [isLoading, setIsLoading] = useState(false);

  // --- Utility Functions ---

  const handleServiceToggle = (service) => {
    setSelectedServices(
      (prev) =>
        prev.includes(service)
          ? prev.filter((s) => s !== service)
          : [...prev, service].sort() // Keep services sorted alphabetically
    );
  };

  // Mock function to simulate fetching location (e.g., from Geocoding API)
  const handleGetLocation = () => {
    Alert.alert(
      "Location Service Mock",
      "In a real app, this would trigger a geocoding API call based on the address to set Latitude/Longitude.",
      [{ text: "OK" }]
    );
  };

  // --- Save Handler ---

  const handleSaveProfile = () => {
    setIsLoading(true);

    // Basic Validation
    if (!garageName || !address || !phone || selectedServices.length === 0) {
      setIsLoading(false);
      Alert.alert(
        "Validation Error",
        "Please fill in all required fields and select at least one service."
      );
      return;
    }

    // Prepare data for API (similar to MongoDB schema)
    const updateData = {
      name: garageName,
      description,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address,
      phone,
      services: selectedServices,
    };

    // Mock API call delay
    setTimeout(() => {
      setIsLoading(false);
      // Log the data that would be sent to the server
      console.log("Updated Garage Data:", updateData);

      Alert.alert(
        "Profile Updated",
        `${garageName} business profile details have been successfully saved!`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    }, 1500);
  };

  // --- Render Components ---

  const renderServiceItem = (service) => {
    const isSelected = selectedServices.includes(service);
    return (
      <TouchableOpacity
        key={service}
        onPress={() => handleServiceToggle(service)}
        style={[
          styles.servicePill,
          {
            backgroundColor: isSelected ? PRIMARY_COLOR : colors.surface,
            borderColor: isSelected ? PRIMARY_COLOR : colors.outline,
          },
        ]}
      >
        <Text style={{ color: isSelected ? "#FFFFFF" : colors.onSurface }}>
          {service}
        </Text>
        {isSelected && (
          <Ionicons
            name="checkmark-circle"
            size={16}
            color="#FFFFFF"
            style={{ marginLeft: 6 }}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
      >
        <Text
          variant="headlineMedium"
          style={[styles.title, { color: PRIMARY_COLOR }]}
        >
          Manage Garage Profile
        </Text>
        <Text variant="bodySmall" style={styles.subtitle}>
          Update your business details, location, and services offered.
        </Text>

        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          {/* --- Business Information Section --- */}
          <Text variant="titleMedium" style={styles.sectionHeader}>
            Business Information
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Garage Name *</Text>
            <TextInput
              placeholder="e.g., Smith's Auto Repair"
              value={garageName}
              onChangeText={setGarageName}
              style={[styles.input, { borderColor: colors.outline }]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              placeholder="Brief description of your garage..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              style={[styles.textArea, { borderColor: colors.outline }]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number *</Text>
            <TextInput
              placeholder="(555) 555-0100"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={[styles.input, { borderColor: colors.outline }]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Street Address *</Text>
            <TextInput
              placeholder="123 Main St, Anytown, USA"
              value={address}
              onChangeText={setAddress}
              style={[styles.input, { borderColor: colors.outline }]}
            />
          </View>

          <Divider style={styles.divider} />

          {/* --- Location Section --- */}
          <Text variant="titleMedium" style={styles.sectionHeader}>
            Location (Geographic Coordinates)
          </Text>

          <View style={styles.locationRow}>
            <View style={styles.locationInput}>
              <Text style={styles.inputLabel}>Latitude *</Text>
              <TextInput
                placeholder="34.0522"
                value={latitude}
                onChangeText={setLatitude}
                keyboardType="numeric"
                style={[styles.input, { borderColor: colors.outline }]}
              />
            </View>
            <View style={styles.locationInput}>
              <Text style={styles.inputLabel}>Longitude *</Text>
              <TextInput
                placeholder="-118.2437"
                value={longitude}
                onChangeText={setLongitude}
                keyboardType="numeric"
                style={[styles.input, { borderColor: colors.outline }]}
              />
            </View>
          </View>

          <Button
            mode="outlined"
            icon="map-marker-radius"
            onPress={handleGetLocation}
            labelStyle={{ color: PRIMARY_COLOR }}
            style={styles.locationButton}
          >
            Fetch Coords from Address
          </Button>

          <Divider style={styles.divider} />

          {/* --- Services Section --- */}
          <Text variant="titleMedium" style={styles.sectionHeader}>
            Services Offered *
          </Text>
          <Text style={styles.servicesHint}>
            Select all services your garage provides:
          </Text>

          <View style={styles.servicesContainer}>
            {allAvailableServices.map(renderServiceItem)}
          </View>
        </Card>

        {/* --- Save Button --- */}
        <View style={styles.footerContainer}>
          <Button
            mode="contained"
            icon="content-save-outline"
            onPress={handleSaveProfile}
            loading={isLoading}
            disabled={isLoading}
            style={styles.saveButton}
            contentStyle={styles.saveContent}
            labelStyle={styles.saveLabel}
          >
            {isLoading ? "Saving Profile..." : "Save Garage Profile"}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    marginBottom: 5,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 20,
    fontSize: 14,
    color: "#757575",
  },
  card: {
    borderRadius: 15,
    padding: 20,
    elevation: 4,
  },
  sectionHeader: {
    fontWeight: "bold",
    color: PRIMARY_COLOR,
    marginTop: 10,
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontWeight: "600",
    marginBottom: 5,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 50,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingTop: 10,
    minHeight: 100,
    fontSize: 16,
    textAlignVertical: "top",
  },
  divider: {
    marginVertical: 25,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  // Location Styles
  locationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  locationInput: {
    width: "48%",
  },
  locationButton: {
    borderColor: PRIMARY_COLOR,
    borderRadius: 8,
  },
  // Services Styles
  servicesHint: {
    color: "#757575",
    marginBottom: 10,
  },
  servicesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 5,
  },
  servicePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 10,
  },
  // Footer/Save Styles
  footerContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  saveButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 10,
  },
  saveContent: {
    paddingVertical: 8,
  },
  saveLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});

export default GarageProfileScreen;
