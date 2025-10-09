import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  // Removed unused imports like Button, Card, Title, Paragraph from 'react-native-paper'
} from "react-native";
import { Button, Card, Title, Paragraph } from "react-native-paper"; // Keep using react-native-paper components
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Notifications from "expo-notifications";
import { getGarageByUserId } from "../../services/garageService";
import { updateNotificationStatusAction } from "../../services/notificationService";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { decode as decodePolyline } from "@mapbox/polyline";
import { Ionicons } from "@expo/vector-icons";

const OSRM_ROUTING_URL = "http://router.project-osrm.org/route/v1/driving/";
const PRIMARY_COLOR = "#4CAF50";
const SECONDARY_TEXT_COLOR = "#757575";

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
  const [activeNotificationId, setActiveNotificationId] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeSummary, setRouteSummary] = useState({
    duration: null,
    distance: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [jobStatus, setJobStatus] = useState("Monitoring");

  const mapRef = useRef(null);
  const { user } = useAuth();
  const userId = user?._id;

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

  // Function to handle job completion (updated to call API and reset state)
  const handleDriverArrived = () => {
    if (!activeNotificationId) {
      Alert.alert("Error", "No active job found to complete.");
      return;
    }

    Alert.alert(
      "Confirm Arrival",
      "Has the driver successfully arrived and the vehicle is delivered? This will mark the job as completed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm & Complete",
          onPress: async () => {
            try {
              // 1. Update status to SERVICE_COMPLETED (using 'complete' alias)
              await updateNotificationStatusAction(
                activeNotificationId,
                "complete"
              );

              // 2. Update local state
              setJobStatus("Arrived & Complete");
              setDriverLocation(null);
              setRouteCoordinates([]);
              setActiveNotificationId(null); // Clear active job

              // 3. User feedback
              Alert.alert(
                "Success",
                "Job status updated to 'SERVICE_COMPLETED'."
              );
            } catch (error) {
              console.error("Failed to complete job:", error);
              Alert.alert(
                "Error",
                "Failed to update job status. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const fetchRoute = async (destination, origin) => {
    if (!origin || !destination) return;
    const osrmUrl = `${OSRM_ROUTING_URL}${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=polyline`;

    try {
      const response = await axios.get(osrmUrl);
      const route = response.data.routes[0];
      const decodedCoords = decodePolyline(route.geometry).map((point) => ({
        latitude: point[0],
        longitude: point[1],
      }));
      setRouteCoordinates(decodedCoords);
      setRouteSummary({ duration: route.duration, distance: route.distance });

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

  const loadInitialData = async () => {
    if (!userId) {
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }
    try {
      setIsLoading(!garageLocation);
      setIsRefreshing(!!garageLocation);

      const response = await getGarageByUserId(userId);
      const data = response?.data;
      if (!data) return;

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
        mapRef.current?.animateToRegion(
          { ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 },
          1000
        );
      }

      // Ensure local job state reflects 'Monitoring' if no job is active on load
      if (activeNotificationId === null) {
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

  useEffect(() => {
    loadInitialData();
  }, [userId]);

  const handleRefresh = () => {
    if (!isRefreshing && !isLoading) loadInitialData();
  };

  // ---------------- Notification Listener (FIXED: Alerts for all incoming jobs) ----------------
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notif) => {
        const { driverLat, driverLng, notificationId } =
          notif.request.content.data || {};

        if (!notificationId) return;

        // *** FIX: REMOVED THE CHECK FOR activeNotificationId ***
        // This ensures the Alert.alert will be shown for every new job notification.

        setTimeout(() => {
          Alert.alert(
            "New Driver Update",
            "Do you want to accept this driver/job?",
            [
              {
                text: "Decline",
                onPress: async () => {
                  try {
                    await updateNotificationStatusAction(
                      notificationId,
                      "decline"
                    );
                    console.log("Notification declined:", notificationId);
                  } catch (err) {
                    console.error("Failed to decline notification:", err);
                  }
                },
                style: "cancel",
              },
              {
                text: "Accept",
                onPress: async () => {
                  // Prevent accepting a new job if one is already active on this screen
                  if (activeNotificationId) {
                    Alert.alert(
                      "Already Active",
                      "Please complete the current job before accepting a new one on this screen."
                    );
                    return;
                  }

                  try {
                    await updateNotificationStatusAction(
                      notificationId,
                      "accept"
                    );
                    console.log("Notification accepted:", notificationId);

                    if (driverLat && driverLng) {
                      const newDriverLocation = {
                        latitude: parseFloat(driverLat),
                        longitude: parseFloat(driverLng),
                      };

                      // SET ACTIVE JOB ID
                      setActiveNotificationId(notificationId);

                      setDriverLocation(newDriverLocation);
                      setJobStatus("Driver En Route");

                      if (garageLocation)
                        fetchRoute(garageLocation, newDriverLocation);
                    }
                  } catch (err) {
                    console.error("Failed to accept notification:", err);
                    Alert.alert(
                      "Acceptance Failed",
                      "Could not accept job. Server error."
                    );
                  }
                },
                style: "default",
              },
            ],
            { cancelable: false }
          );
        }, 100);
      }
    );

    // activeNotificationId is kept in the dependency array to correctly read its current value
    return () => subscription.remove();
  }, [garageLocation, activeNotificationId]);

  useEffect(() => {
    if (garageLocation && driverLocation) {
      fetchRoute(garageLocation, driverLocation);
    }
  }, [garageLocation, driverLocation]);

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
      : "Awaiting New Job / Monitoring";

  const initialRegion = {
    latitude: garageLocation?.latitude || 37.78825,
    longitude: garageLocation?.longitude || -122.4324,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <SafeAreaView style={styles.container}>
      <MapView ref={mapRef} style={styles.map} initialRegion={initialRegion}>
        {garageLocation && (
          <Marker
            coordinate={garageLocation}
            title={garageInfo?.name || "Your Garage"}
            description="Destination"
            pinColor="blue"
          />
        )}
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            title="Driver"
            description={`ETA: ${formatDuration(routeSummary.duration)}`}
            pinColor="red"
          />
        )}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={5}
            strokeColor={PRIMARY_COLOR}
          />
        )}
      </MapView>

      {/* Top Status Card */}
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

          {driverLocation && jobStatus !== "Arrived & Complete" ? (
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
          ) : (
            <Paragraph style={styles.waitingText}>
              {jobStatus === "Arrived & Complete"
                ? "Job has been successfully completed."
                : "Awaiting a new job request..."}
            </Paragraph>
          )}
        </Card.Content>
      </Card>

      {/* Bottom Action Card */}
      {jobStatus !== "Arrived & Complete" ? (
        <Card style={styles.bottomCard}>
          <Card.Content>
            <Title style={styles.jobControlTitle}>Job Control</Title>
            <Paragraph style={styles.jobControlParagraph}>
              Update job status once the vehicle has been successfully dropped
              off at your garage.
            </Paragraph>
            <Button
              mode="contained"
              icon="check-circle-outline"
              onPress={handleDriverArrived}
              style={[styles.actionButton, { backgroundColor: PRIMARY_COLOR }]}
              labelStyle={styles.actionButtonLabel}
              disabled={!driverLocation || !activeNotificationId} // Disabled if no job is active
            >
              Driver Arrived / Complete Job
            </Button>
          </Card.Content>
        </Card>
      ) : (
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
  topCardContent: { paddingVertical: 15 },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  statusTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  refreshButton: { minWidth: 40 },
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
  summaryItem: { alignItems: "center", paddingHorizontal: 15 },
  summaryText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
    marginTop: 5,
  },
  summaryLabel: { fontSize: 12, color: SECONDARY_TEXT_COLOR, marginTop: 2 },
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
  bottomCardCompleted: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    backgroundColor: "#E8F5E9",
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
  actionButtonLabel: { fontSize: 16, fontWeight: "bold" },
});

export default GarageMapScreen;
