import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView, Alert, Platform } from "react-native";
import {
  Text,
  Button,
  useTheme,
  Card,
  List,
  Chip, // For displaying services
  Divider,
} from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { getGarageByUserId } from "../../services/garageService";
import { useAuth } from "../../context/AuthContext";

const PRIMARY_COLOR = "#4CAF50";

const GarageViewScreen = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const userId = user?._id;

  // State for the loaded, original garage data (fetched from API)
  const [garage, setGarage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- Data Fetching Logic ---
  const fetchMyGarage = useCallback(async () => {
    if (!userId) {
      console.warn("User ID not available. Cannot fetch garage.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      // NOTE: Using the actual service call
      const response = await getGarageByUserId(userId);

      if (response.data) {
        setGarage(response.data);
      } else {
        setGarage(null);
      }
    } catch (error) {
      console.error("Error fetching garage by user ID:", error);
      Alert.alert(
        "Fetch Failed",
        "Could not load your garage data. Please check your network."
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Initial data fetch
  useEffect(() => {
    fetchMyGarage();
  }, [fetchMyGarage]);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text variant="headlineMedium">Loading Garage Data...</Text>
      </View>
    );
  }

  if (!garage) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text variant="headlineMedium" style={{ marginBottom: 20 }}>
          No Garage Profile Found
        </Text>
        <Button
          mode="contained"
          onPress={() =>
            Alert.alert(
              "Feature",
              "Navigate to a screen to create a new garage profile."
            )
          }
        >
          Create Profile
        </Button>
      </View>
    );
  }

  // --- Render Logic (View Only) ---
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.headerContainer}>
        <Text variant="headlineMedium" style={{ color: colors.onSurface }}>
          {garage.name || "Garage Profile"}
        </Text>
        {/* Removed Edit Button */}
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
          <List.Item
            title="Name"
            description={garage.name}
            left={(props) => (
              <Icon {...props} name="garage-open" color={colors.primary} />
            )}
            style={styles.viewItem}
          />
          <Divider style={styles.listDivider} />

          {/* Description */}
          <List.Item
            title="Description"
            description={garage.description || "No description provided."}
            descriptionNumberOfLines={3}
            left={(props) => (
              <Icon
                {...props}
                name="text-box-multiple-outline"
                color={colors.primary}
              />
            )}
            style={styles.viewItem}
          />
          <Divider style={styles.listDivider} />

          {/* Phone */}
          <List.Item
            title="Phone"
            description={garage.phone || "N/A"}
            left={(props) => (
              <Icon {...props} name="phone-outline" color={colors.primary} />
            )}
            style={styles.viewItem}
          />
          <Divider style={styles.listDivider} />

          {/* Address */}
          <List.Item
            title="Address"
            description={garage.address || "No address set."}
            left={(props) => (
              <Icon
                {...props}
                name="map-marker-outline"
                color={colors.primary}
              />
            )}
            style={styles.viewItem}
          />
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
            Location Details
          </Text>
          <View style={styles.mapPlaceholder}>
            <Icon name="map" size={50} color={colors.backdrop} />
            <Text style={{ color: colors.onSurfaceVariant, marginTop: 5 }}>
              Map Preview Placeholder
            </Text>
            <Text variant="bodyMedium" style={{ marginTop: 10 }}>
              Latitude: {garage.latitude}
            </Text>
            <Text variant="bodyMedium">Longitude: {garage.longitude}</Text>
          </View>

          <Divider style={styles.innerDivider} />

          {/* Services Offered */}
          <View>
            <Text variant="titleMedium" style={styles.subTitle}>
              Services Offered
            </Text>
            <View style={styles.servicesContainer}>
              {garage.services && garage.services.length > 0 ? (
                garage.services.map((service, index) => (
                  <Chip
                    key={service + index}
                    icon="check-circle"
                    mode="flat"
                    style={[
                      styles.serviceChip,
                      { backgroundColor: PRIMARY_COLOR + "10" },
                    ]}
                    textStyle={{ color: PRIMARY_COLOR }}
                  >
                    {service}
                  </Chip>
                ))
              ) : (
                <Text variant="bodyMedium" style={{ color: colors.error }}>
                  No services currently listed.
                </Text>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
};

// --- Styles (Adapted for the new List.Item structure) ---
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
  mainDivider: { marginVertical: 15 },

  // Cards & Fields
  infoCard: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 2,
  },
  listDivider: {
    marginVertical: 0,
    marginHorizontal: 15,
  },
  viewItem: {
    paddingHorizontal: 0,
    paddingVertical: 0,
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

  // Services
  servicesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 5,
  },
  serviceChip: {
    margin: 4,
  },
});

export default GarageViewScreen;
