import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from "react-native";
import { Button, Card, Title, Paragraph } from "react-native-paper";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Notifications from "expo-notifications";
import { getGarageByUserId } from "../../services/garageService";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { decode as decodePolyline } from "@mapbox/polyline";
import { Ionicons } from "@expo/vector-icons";

// Define Constants
const OSRM_ROUTING_URL = "http://router.project-osrm.org/route/v1/driving/";
const PRIMARY_COLOR = "#4CAF50"; // Brand color (Green)
const SECONDARY_TEXT_COLOR = "#757575";

// Configure Notification Handler to allow showing alerts in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const GarageMapScreen = () => {
  const [garageLocation, setGarageLocation] = useState(null);
  const [garageInfo, setGarageInfo] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeSummary, setRouteSummary] = useState({
    duration: null,
    distance: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [jobStatus, setJobStatus] = useState("Monitoring");

  const mapRef = useRef(null);
  // Assuming useAuth provides a user object with an identifier
  const { user } = useAuth();
  const userId = user?._id;

  // Helper functions for formatting route data
  const formatDuration = (seconds) => {
    if (!seconds) return "...";
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  };

  const formatDistance = (meters) => {
    if (!meters) return "...";
    const km = (meters / 1000).toFixed(1);
    return `${km} km`;
  };

  // Handler for marking the job as complete
  const handleDriverArrived = () => {
    Alert.alert(
      "Confirm Arrival",
      "Has the driver successfully arrived and the vehicle is delivered?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Confirm & Complete",
          onPress: () => {
            setJobStatus("Arrived & Complete");
            // TODO: Call backend service to update the persistent job status
            Alert.alert(
              "Success",
              "Job status updated to 'Arrived & Complete'."
            );
            // Clear markers/route to reflect completion
            setDriverLocation(null);
            setRouteCoordinates([]);
          },
          style: "default",
        },
      ]
    );
  };

  // Function to fetch the route coordinates and summary from OSRM
  const fetchRoute = async (destination, origin) => {
    if (!origin || !destination) return;

    // OSRM expects coordinates in LON,LAT;LON,LAT format
    const osrmUrl =
      `${OSRM_ROUTING_URL}${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}` +
      `?overview=full&geometries=polyline`;

    try {
      const response = await axios.get(osrmUrl);
      const route = response.data.routes[0];
      const polyline = route.geometry;

      const decodedCoords = decodePolyline(polyline).map((point) => ({
        latitude: point[0],
        longitude: point[1],
      }));

      setRouteCoordinates(decodedCoords);
      setRouteSummary({
        duration: route.duration,
        distance: route.distance,
      });

      // Fit map to show both markers and the route
      if (mapRef.current) {
        mapRef.current.fitToCoordinates([destination, origin], {
          edgePadding: { top: 150, right: 50, bottom: 200, left: 50 },
          animated: true,
        });
      }
    } catch (error) {
      console.error("Error fetching OSRM route:", error);
      setRouteCoordinates([]);
      setRouteSummary({ duration: null, distance: null });
    }
  };

  // 1. Core function to fetch garage data (initial load or manual refresh)
  const loadInitialData = async () => {
    if (!userId) {
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      if (!garageLocation) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true); // Use refresh indicator for subsequent loads
      }

      const response = await getGarageByUserId(userId);

      if (!response || !response.data) {
        console.error("Failed to retrieve valid garage data.");
        return;
      }

      const data = response.data;

      if (data.latitude != null && data.longitude != null) {
        const coords = {
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
        };
        setGarageLocation(coords);
        setGarageInfo({
          name: data.name || "My Garage",
          address: data.address || "Unknown Address",
        });
        // Animate to garage location on initial load
        mapRef.current?.animateToRegion(
          { ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 },
          1000
        );
      }

      // Manually reset tracking status if required after refresh
      if (!driverLocation && jobStatus !== "Monitoring") {
        setJobStatus("Monitoring");
        setDriverLocation(null);
        setRouteCoordinates([]);
      }
    } catch (err) {
      console.error("Error fetching garage location:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial Data Load Effect (runs once on mount)
  useEffect(() => {
    loadInitialData();
  }, [userId]);

  // Manual Refresh Handler
  const handleRefresh = () => {
    if (!isRefreshing && !isLoading) {
      loadInitialData();
    }
  };

  // 2. Notification Listener for Driver Location Updates
  useEffect(() => {
    // This listener will capture location pings sent as notifications
    const subscription = Notifications.addNotificationReceivedListener(
      (notif) => {
        const { driverLat, driverLng, jobId } =
          notif.request.content.data || {};

        // Only process if we receive coordinates and the job isn't complete
        if (driverLat && driverLng && jobStatus !== "Arrived & Complete") {
          const newDriverLocation = {
            latitude: parseFloat(driverLat),
            longitude: parseFloat(driverLng),
          };
          setDriverLocation(newDriverLocation);
          setJobStatus("Driver En Route");

          // Destination is the GarageLocation, Origin is the DriverLocation
          if (garageLocation) {
            fetchRoute(garageLocation, newDriverLocation);
          }
        }
      }
    );

    // ✅ CLEANUP FIX: Using the correct .remove() method on the subscription object.
    // This ensures no TypeError when the component unmounts.
    return () => subscription.remove();
  }, [garageLocation, jobStatus]); // Dependencies ensure fresh state is available inside the listener

  // Re-fetch route if locations load asynchronously (e.g., initial state population)
  useEffect(() => {
    if (garageLocation && driverLocation) {
      fetchRoute(garageLocation, driverLocation);
    }
  }, [garageLocation, driverLocation]);

  // Render loading screen while fetching initial garage location
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={styles.loadingText}>Loading tracking session...</Text>
      </View>
    );
  }

  const statusText =
    jobStatus === "Arrived & Complete"
      ? "Job Complete"
      : driverLocation
      ? "Driver En Route"
      : "Awaiting First Location Update";

  // Ensure the map can render if garageLocation is null (e.g., if garage data is missing)
  const initialRegion = {
    latitude: garageLocation?.latitude || 37.78825, // Fallback to SF if no garage
    longitude: garageLocation?.longitude || -122.4324,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <SafeAreaView style={styles.container}>
      <MapView ref={mapRef} style={styles.map} initialRegion={initialRegion}>
        {/* Garage Marker (Destination) */}
        {garageLocation && (
          <Marker
            coordinate={garageLocation}
            title={garageInfo?.name || "Your Garage"}
            description={"Destination"}
            pinColor="blue"
          />
        )}

        {/* Driver Marker (Source) */}
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            title="Driver"
            description={`ETA: ${formatDuration(routeSummary.duration)}`}
            pinColor="red"
          />
        )}

        {/* Draw the route */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={5}
            strokeColor={PRIMARY_COLOR}
          />
        )}
      </MapView>

      {/* --------------------- Top Status Card --------------------- */}
      <Card style={styles.topCard}>
        <Card.Content style={styles.topCardContent}>
          <View style={styles.statusHeader}>
            <Title style={styles.statusTitle}>{statusText}</Title>
            <Button
              mode="text"
              onPress={handleRefresh}
              loading={isRefreshing}
              disabled={isRefreshing}
              style={styles.refreshButton}
            >
              {!isRefreshing && (
                <Ionicons
                  name="refresh-circle-outline"
                  size={24}
                  color={PRIMARY_COLOR}
                />
              )}
            </Button>
          </View>

          {driverLocation && jobStatus !== "Arrived & Complete" && (
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Ionicons name="time-outline" size={24} color={PRIMARY_COLOR} />
                <Text style={styles.summaryText}>
                  {formatDuration(routeSummary.duration)}
                </Text>
                <Text style={styles.summaryLabel}>Estimated Time</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons
                  name="git-branch-outline"
                  size={24}
                  color={PRIMARY_COLOR}
                />
                <Text style={styles.summaryText}>
                  {formatDistance(routeSummary.distance)}
                </Text>
                <Text style={styles.summaryLabel}>Remaining Distance</Text>
              </View>
            </View>
          )}
          {!driverLocation && jobStatus !== "Arrived & Complete" && (
            <Paragraph style={styles.waitingText}>
              Tracking session active. Waiting for driver's first location
              ping...
            </Paragraph>
          )}
        </Card.Content>
      </Card>

      {/* --------------------- Bottom Action Card (Job Control) --------------------- */}
      {jobStatus !== "Arrived & Complete" && (
        <Card style={styles.bottomCard}>
          <Card.Content>
            <Title style={styles.jobControlTitle}>Job Control</Title>
            <Paragraph style={styles.jobControlParagraph}>
              Update job status once the vehicle has been successfully dropped
              off.
            </Paragraph>

            <Button
              mode="contained"
              icon="check-circle-outline"
              onPress={handleDriverArrived}
              style={[styles.actionButton, { backgroundColor: PRIMARY_COLOR }]}
              labelStyle={styles.actionButtonLabel}
              // Only enable button if we have a driver location (they started the job)
              disabled={!driverLocation}
            >
              Driver Arrived / Complete Job
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Show completion message when done */}
      {jobStatus === "Arrived & Complete" && (
        <Card style={styles.bottomCardCompleted}>
          <Card.Content style={{ alignItems: "center" }}>
            <Ionicons name="checkmark-circle" size={36} color={PRIMARY_COLOR} />
            <Title style={styles.jobControlTitle}>Tracking Complete</Title>
            <Paragraph style={styles.jobControlParagraph}>
              The vehicle has arrived and the job is marked as finished.
            </Paragraph>
          </Card.Content>
        </Card>
      )}
    </SafeAreaView>
  );
};

// --------------------- Styles for Presentation ---------------------
const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: { marginTop: 10, fontSize: 16, color: "#555" },

  // Top Card Styles
  topCard: {
    position: "absolute",
    top: 10,
    left: 20,
    right: 20,
    zIndex: 10,
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  topCardContent: {
    paddingVertical: 15,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  refreshButton: {
    minWidth: 40,
  },
  waitingText: {
    fontSize: 14,
    color: SECONDARY_TEXT_COLOR,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  summaryItem: {
    alignItems: "center",
    paddingHorizontal: 15,
  },
  summaryText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
    marginTop: 5,
  },
  summaryLabel: {
    fontSize: 12,
    color: SECONDARY_TEXT_COLOR,
    marginTop: 2,
  },

  // Bottom Card Styles (Active Tracking)
  bottomCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    backgroundColor: "#fff",
    paddingVertical: 10,
  },
  // Bottom Card Styles (Completed)
  bottomCardCompleted: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    backgroundColor: "#E8F5E9", // Light green background
    paddingVertical: 15,
  },
  jobControlTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
    textAlign: "center",
  },
  jobControlParagraph: {
    fontSize: 14,
    color: SECONDARY_TEXT_COLOR,
    marginBottom: 15,
    marginTop: 5,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  actionButton: {
    marginTop: 10,
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 5,
    borderRadius: 8,
  },
  actionButtonLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default GarageMapScreen;
