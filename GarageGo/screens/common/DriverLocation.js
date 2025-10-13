import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  TouchableOpacity, // Imported for the new button
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import MapView, { Marker, Polyline } from "react-native-maps";
import axios from "axios";
import { decode as decodePolyline } from "@mapbox/polyline";

// --- SERVICE IMPORT REQUIRED FOR COMPLETION BUTTON ---
import { updateNotificationStatus } from "../../services/statsService";
// ----------------------------------------------------

const LATITUDE_DELTA = 0.05;
const PRIMARY_COLOR = "#4CAF50";

/**
 * Screen displaying the route from the Garage (Origin) to the Driver (Destination/Customer).
 * Includes the "Mark as Completed" functionality.
 */
const DriverLocationScreen = ({ route, navigation }) => {
  const {
    driverLatitude,
    driverLongitude,
    garageLatitude,
    garageLongitude,
    driverName,
    notificationId, // NEW: Used for completing the job
    garageId, // NEW: Used for context (optional, but good to pass)
  } = route.params;

  const [windowDimensions, setWindowDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [longitudeDelta, setLongitudeDelta] = useState(LATITUDE_DELTA);

  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [loadingRoute, setLoadingRoute] = useState(true);
  const [routeError, setRouteError] = useState(null);
  const [isCompleting, setIsCompleting] = useState(false); // NEW state for button loading

  const mapRef = useRef(null);

  // --- COORDINATE ASSIGNMENT (Standard (Lat, Lon) for Origin, Swapped for Destination) ---
  const origin = {
    latitude: garageLatitude,
    longitude: garageLongitude,
  };

  // Destination is SWAPPED to correct map placement (Lon to Lat, Lat to Lon)
  const destination = {
    latitude: driverLongitude,
    longitude: driverLatitude,
  };
  // ----------------------------------------------------------------------------------------

  // OSRM URL requires (LON, LAT).
  const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=polyline`;

  // Dynamic dimension calculation (existing logic)
  useEffect(() => {
    try {
      const { width, height } = Dimensions.get("window");
      if (width > 0 && height > 0) {
        setWindowDimensions({ width, height });
        const newAspectRatio = width / height;
        const newLongitudeDelta = LATITUDE_DELTA * newAspectRatio;
        setLongitudeDelta(newLongitudeDelta);
      }

      const onChange = ({ window }) => {
        const newAspectRatio = window.width / window.height;
        const newLongitudeDelta = LATITUDE_DELTA * newAspectRatio;
        setWindowDimensions(window);
        setLongitudeDelta(newLongitudeDelta);
      };
      const subscription = Dimensions.addEventListener("change", onChange);
      return () => subscription.remove();
    } catch (e) {
      console.warn("Could not retrieve React Native Dimensions.");
    }
  }, []);

  // Initial Region (existing logic)
  const initialRegion = {
    latitude: (origin.latitude + destination.latitude) / 2,
    longitude: (origin.longitude + destination.longitude) / 2,
    latitudeDelta: LATITUDE_DELTA * 4,
    longitudeDelta: longitudeDelta * 4,
  };

  /**
   * Fetches the route from the OSRM server and updates state. (existing logic)
   */
  const fetchRoute = async () => {
    // ... existing fetchRoute logic (omitted for brevity)
    if (windowDimensions.width === 0) {
      setLoadingRoute(false);
      return;
    }

    setLoadingRoute(true);
    setRouteError(null);
    setRouteCoordinates([]);

    try {
      const routeResponse = await axios.get(osrmUrl);

      if (
        !routeResponse.data.routes ||
        routeResponse.data.routes.length === 0
      ) {
        throw new Error("OSRM returned no route data.");
      }

      const polyline = routeResponse.data.routes[0].geometry;
      const decodedCoords = decodePolyline(polyline).map((point) => ({
        latitude: point[0],
        longitude: point[1],
      }));

      setRouteCoordinates(decodedCoords);

      if (mapRef.current) {
        const coordinatesToFit = [origin, destination];
        mapRef.current.fitToCoordinates(coordinatesToFit, {
          edgePadding: { top: 100, right: 50, bottom: 250, left: 50 },
          animated: true,
        });
      }
    } catch (error) {
      console.error("Error fetching OSRM route:", error);
      setRouteError("Could not calculate driving route.");
      Alert.alert(
        "Routing Error",
        "Failed to fetch the driving route. Showing direct line instead."
      );

      setRouteCoordinates([origin, destination]);
    } finally {
      setLoadingRoute(false);
    }
  };

  useEffect(() => {
    fetchRoute();
  }, [
    origin.latitude,
    origin.longitude,
    destination.latitude,
    destination.longitude,
    longitudeDelta,
  ]);

  // --- NEW FUNCTION: Handle Job Completion ---
  const handleCompleteJob = async () => {
    if (!notificationId) {
      Alert.alert("Error", "Job ID is missing. Cannot complete job.");
      return;
    }

    Alert.alert(
      "Confirm Job Completion",
      `Are you sure you want to mark the job for ${driverName} as SERVICE_COMPLETED?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Complete Job",
          style: "default",
          onPress: async () => {
            setIsCompleting(true);
            try {
              // Call the backend service to update the status
              await updateNotificationStatus(
                notificationId,
                "SERVICE_COMPLETED"
              );

              Alert.alert(
                "Success",
                "Job marked as completed. Returning to dashboard.",
                [
                  // Navigate back to the dashboard after success
                  { text: "OK", onPress: () => navigation.goBack() },
                ]
              );
            } catch (error) {
              console.error("Error completing job:", error);
              Alert.alert(
                "Error",
                "Failed to mark job as complete. Please try again."
              );
            } finally {
              setIsCompleting(false);
            }
          },
        },
      ]
    );
  };
  // ---------------------------------------------

  return (
    <View style={styles.container}>
      {/* Map View Area */}
      {windowDimensions.width > 0 && (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          provider="google"
        >
          {/* Green Marker (Origin) */}
          <Marker
            coordinate={origin}
            title="Your Garage"
            description="Service starting point"
            pinColor={PRIMARY_COLOR}
          />

          {/* Red Marker (Destination) */}
          <Marker
            coordinate={destination}
            title={`${driverName}'s Location`}
            description="Customer Pickup Location"
            pinColor="#E53935"
          />

          {/* Route Line (Polyline) */}
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={routeError ? "#9E9E9E" : "#2196F3"}
            strokeWidth={4}
            lineJoin="round"
            lineCap="round"
            lineDashPattern={routeError ? [10, 10] : undefined}
          />
        </MapView>
      )}

      {/* Info Panel */}
      <View style={styles.infoPanel}>
        <Text style={styles.title}>Route to {driverName}</Text>

        {loadingRoute || windowDimensions.width === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2196F3" />
            <Text style={styles.loadingText}>
              {windowDimensions.width === 0
                ? "Initializing map environment..."
                : "Calculating optimal route..."}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.infoNote}>
              (Destination coordinates swapped for correct map placement.)
            </Text>
            <View style={styles.detailRow}>
              <AntDesign name="environment" size={16} color={PRIMARY_COLOR} />
              <Text style={styles.detailText}>
                Origin (Garage): Lat {origin.latitude.toFixed(6)}, Lon{" "}
                {origin.longitude.toFixed(6)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <AntDesign name="pushpin" size={16} color="#E53935" />
              <Text style={styles.detailText}>
                Destination (Driver): Lat {destination.latitude.toFixed(6)}, Lon{" "}
                {destination.longitude.toFixed(6)}
              </Text>
            </View>

            {routeError ? (
              <Text style={styles.errorText}>
                {routeError} Showing direct line.
              </Text>
            ) : (
              <Text style={styles.distanceText}>
                (Calculated route with {routeCoordinates.length} points is
                displayed.)
              </Text>
            )}
          </>
        )}

        {/* --- NEW: Job Completion Button --- */}
        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleCompleteJob}
          disabled={isCompleting || loadingRoute}
        >
          {isCompleting ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <AntDesign name="checkcircleo" size={20} color="white" />
              <Text style={styles.completeButtonText}>Mark as Completed</Text>
            </>
          )}
        </TouchableOpacity>
        {/* ---------------------------------- */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  map: {
    width: "100%",
    height: "65%", // Reduced height to fit the button in the info panel
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    overflow: "hidden",
  },
  infoPanel: {
    height: "35%", // Increased height to accommodate the button
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    justifyContent: "space-between", // Key to pushing the button to the bottom
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  infoNote: {
    fontSize: 10,
    fontStyle: "italic",
    color: "#4CAF50",
    marginBottom: 10,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#2196F3",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#555",
  },
  distanceText: {
    fontSize: 12,
    fontStyle: "italic",
    color: PRIMARY_COLOR,
    marginTop: 10,
  },
  errorText: {
    fontSize: 14,
    color: "#E53935",
    marginTop: 10,
    fontWeight: "500",
  },
  // New Button Style
  completeButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    elevation: 3,
    minHeight: 45,
  },
  completeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
});

export default DriverLocationScreen;
