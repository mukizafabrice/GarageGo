import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Linking, // Import Linking for the Call button
  ActivityIndicator, // Import ActivityIndicator for better loading
} from "react-native";
// Import Card, Title, Paragraph for modern UI presentation
import { Button, Card, Title, Paragraph } from "react-native-paper";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { findNearestGarage } from "../services/garageService.js";
import axios from "axios";
import { decode as decodePolyline } from "@mapbox/polyline";
// -----------------------------------------------------------------
// NEW: Import for Notifications
import * as Notifications from "expo-notifications";
// -----------------------------------------------------------------

// Define Constants for Styling
const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.05;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const PRIMARY_COLOR = "#4CAF50"; // Green brand color
const SECONDARY_TEXT_COLOR = "#757575";
const DANGER_COLOR = "#D32F2F"; // Red for secondary actions

// -----------------------------------------------------------------
// Configure Notification Handler to show alerts in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
// -----------------------------------------------------------------

// Custom Header Component - Cleaned up
const Header = ({ onProfilePress }) => (
  <View style={headerStyles.container}>
    <View style={headerStyles.logoContainer}>
      <Text style={headerStyles.logoText}>GarageGo</Text>
    </View>
    <TouchableOpacity onPress={onProfilePress} style={headerStyles.profileIcon}>
      <Ionicons name="person-circle-outline" size={30} color="#FFFFFF" />
    </TouchableOpacity>
  </View>
);

const LandingPage = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [nearestGarage, setNearestGarage] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); // Initial load (for location)
  const [findingGarage, setFindingGarage] = useState(false); // Button loading state
  const [isRefreshing, setIsRefreshing] = useState(false); // Floating refresh state

  const mapRef = useRef(null);
  const navigation = useNavigation();

  const handleProfilePress = () => {
    navigation.navigate("Login");
  };

  const handleCallGarage = () => {
    if (nearestGarage?.phone) {
      Linking.openURL(`tel:${nearestGarage.phone}`);
    } else {
      Alert.alert("Error", "Garage phone number not available.");
    }
  };

  // Function to clear the search results and return to the default state
  const handleNewSearch = () => {
    setNearestGarage(null);
    setRouteCoordinates([]);

    // Animate map back to user's location for a clean start
    if (mapRef.current && userLocation) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        },
        500
      );
    }
  };

  // -----------------------------------------------------------------
  // Notification Listeners (runs once on component mount)
  useEffect(() => {
    // Listener for notifications received while the app is in the foreground
    const receivedListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        // --- CRITICAL FILTER ADDED HERE ---
        const data = notification.request.content.data || {};
        const { driverLat, driverLng } = data;

        // If driver location data exists, this notification is for the garage/driver tracking.
        // The consumer app MUST ignore it to stop unwanted notifications/processing.
        if (driverLat || driverLng) {
          console.log(
            "Consumer Listener: IGNORING driver location update (intended for Garage App)."
          );
          return; // EXIT immediately
        }
        // --- END CRITICAL FILTER ---

        console.log(
          "[Notification Received] App is in the foreground:",
          notification.request.content.title
        );
        // Optional: Handle the incoming notification data if needed, e.g., update state
      }
    );

    // Listener for when a user taps on the notification (app is backgrounded/closed)
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const garageName =
          response.notification.request.content.data.garageName;
        console.log(
          "[Notification Tapped] User opened app via notification for:",
          garageName
        );
        // You could navigate to a detailed screen here using the garageName data
      });

    // Clean up listeners on component unmount
    return () => {
      // ✅ FIX APPLIED HERE: Using the correct .remove() method on the subscription objects.
      if (receivedListener) {
        receivedListener.remove();
      }
      if (responseListener) {
        responseListener.remove();
      }
      // The previous line: Notifications.removeNotificationSubscription(...) has been removed.
    };
  }, []);
  // -----------------------------------------------------------------

  // -----------------------------------------------------------------
  // Function to schedule a notification
  const scheduleGarageFoundNotification = async (garageName) => {
    try {
      // 1. Request permissions (if not already granted)
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        console.log("Notification permission denied.");
        return;
      }

      // 2. Schedule the notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "✅ Nearest Garage Found!",
          body: `We located: ${garageName}. Tap to view details.`,
          data: { garageName: garageName },
          sound: true, // Enable sound
        },
        trigger: { seconds: 1 }, // Show almost immediately
      });

      // ADDED LOG: Confirm scheduling was requested
      console.log(
        `[Notification] Successfully requested scheduling for: ${garageName}`
      );
    } catch (e) {
      console.error("Error scheduling notification:", e);
    }
  };
  // -----------------------------------------------------------------

  // Helper function to fetch route and adjust map view
  const fetchRouteAndAdjustMap = async (userLoc, garage) => {
    // OSRM requires LON, LAT order
    const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${userLoc.longitude},${userLoc.latitude};${garage.longitude},${garage.latitude}?overview=full&geometries=polyline`;

    try {
      const routeResponse = await axios.get(osrmUrl);
      const polyline = routeResponse.data.routes[0].geometry;
      const decodedCoords = decodePolyline(polyline).map((point) => ({
        latitude: point[0],
        longitude: point[1],
      }));

      setRouteCoordinates(decodedCoords);

      // Adjust map view to fit both user and garage markers
      if (mapRef.current) {
        mapRef.current.fitToCoordinates(
          [
            { latitude: userLoc.latitude, longitude: userLoc.longitude },
            { latitude: garage.latitude, longitude: garage.longitude },
          ],
          {
            edgePadding: { top: 150, right: 50, bottom: 200, left: 50 },
            animated: true,
          }
        );
      }
    } catch (routeError) {
      console.error("Error fetching OSRM route:", routeError);
      Alert.alert("Route Error", "Could not calculate driving route.");
      setRouteCoordinates([]);
    }
  };

  // ------------------ Unified Location Fetch and Search Logic ------------------
  const fetchLocationAndSearch = async (isInitialLoad = false) => {
    // Set appropriate loading state
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
      setFindingGarage(true);
      // Clear previous results immediately on refresh
      setNearestGarage(null);
      setRouteCoordinates([]);
    }
    setError(null);

    try {
      // 1. Get User Location (always re-fetch on search/refresh)
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location access denied. Please enable location services.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const currentLocation = loc.coords;
      setUserLocation(currentLocation);

      // 2. Find Nearest Garage (Only search if not just an initial location fetch)
      if (isInitialLoad && !findingGarage && !isRefreshing) {
        // Skip search on initial load unless explicitly triggered
        return;
      }

      const response = await findNearestGarage(
        currentLocation.latitude,
        currentLocation.longitude
      );

      if (response.success && response.nearestGarage) {
        const garage = response.nearestGarage;
        setNearestGarage(garage);

        // Trigger the notification
        scheduleGarageFoundNotification(garage.name);

        // 3. Fetch OSRM Route and adjust map
        await fetchRouteAndAdjustMap(currentLocation, garage);
      } else {
        Alert.alert(
          "No Garages Found",
          response.message || "Failed to find nearest garage in your area."
        );
      }
    } catch (err) {
      console.error("Error during operation:", err);
      setError("Error connecting to the service or fetching location.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setFindingGarage(false);
    }
  };

  // ------------------ Initial Load Effect ------------------
  useEffect(() => {
    // Only fetch location initially, don't search yet
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Location access denied. Map cannot show current position.");
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setUserLocation(loc.coords);
      } catch (err) {
        console.error(err);
        setError("Error getting location. Please check settings.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ------------------ Main Action Handler (now triggers search) ------------------
  const handleFindPress = () => {
    if (!userLocation) {
      Alert.alert(
        "Location Not Ready",
        "Please wait for your location or check permissions."
      );
      return;
    }
    // Start a full search cycle
    fetchLocationAndSearch(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={styles.loadingText}>Fetching your location...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header onProfilePress={handleProfilePress} />

      <View style={styles.mapContainer}>
        {/* MAP VIEW */}
        {userLocation || !error ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={
              userLocation
                ? {
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                    latitudeDelta: LATITUDE_DELTA,
                    longitudeDelta: LONGITUDE_DELTA,
                  }
                : undefined
            }
            showsUserLocation={true}
          >
            {/* Marker for the nearest garage */}
            {nearestGarage && (
              <Marker
                coordinate={{
                  latitude: nearestGarage.latitude,
                  longitude: nearestGarage.longitude,
                }}
                title={nearestGarage.name}
                description={nearestGarage.address || "Nearest Garage"}
                pinColor="blue"
              />
            )}

            {/* Draw the route */}
            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeWidth={5}
                strokeColor={PRIMARY_COLOR} // Use brand color
              />
            )}
          </MapView>
        ) : (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {/* --------------------- REFRESH BUTTON (Floating) --------------------- */}
        {/* This button serves as the universal re-search/refresh action */}
        <TouchableOpacity
          style={styles.refreshFloatingButton}
          onPress={() => fetchLocationAndSearch(false)}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="refresh" size={28} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        {/* --------------------- TOP ACTION CARD --------------------- */}
        {!nearestGarage && ( // Show only before a garage is successfully found
          <Card style={styles.actionCard}>
            <Card.Content>
              <Title style={styles.actionTitle}>Need a Fix?</Title>
              <Paragraph style={styles.actionParagraph}>
                Tap the button to instantly locate the closest available garage.
              </Paragraph>
              <Button
                mode="contained"
                onPress={handleFindPress}
                style={styles.findButton}
                labelStyle={styles.findButtonLabel}
                loading={findingGarage}
                disabled={findingGarage || !userLocation}
              >
                {findingGarage ? "Searching..." : "Find Nearest Garage"}
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* --------------------- BOTTOM INFO CARD --------------------- */}
        {nearestGarage && ( // Show only when a garage is found
          <Card style={styles.infoCard}>
            <Card.Content>
              <Title style={styles.infoTitle}>
                <Ionicons
                  name="car-sport-outline"
                  size={24}
                  color={PRIMARY_COLOR}
                />{" "}
                {nearestGarage.name}
              </Title>

              <View style={styles.infoDetails}>
                <View style={styles.detailItem}>
                  <Ionicons
                    name="pin-outline"
                    size={16}
                    color={SECONDARY_TEXT_COLOR}
                  />
                  <Paragraph style={styles.detailText}>
                    {nearestGarage.address || "Address not listed"}
                  </Paragraph>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons
                    name="star-outline"
                    size={16}
                    color={SECONDARY_TEXT_COLOR}
                  />
                  <Paragraph style={styles.detailText}>
                    {nearestGarage.rating || "N/A"}
                  </Paragraph>
                </View>
              </View>

              <View style={styles.infoActions}>
                {/* NEW SEARCH BUTTON */}
                <Button
                  mode="outlined"
                  icon="chevron-left"
                  onPress={handleNewSearch}
                  style={styles.newSearchButton}
                  labelStyle={styles.newSearchButtonLabel}
                >
                  New Search
                </Button>

                {/* CALL BUTTON */}
                <Button
                  mode="contained"
                  icon="phone"
                  onPress={handleCallGarage}
                  style={styles.callButton}
                  labelStyle={styles.callButtonLabel}
                >
                  Call Now
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}
      </View>
    </SafeAreaView>
  );
};

export default LandingPage;

// --------------------- Styles ---------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F0F0" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  mapContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  map: { ...StyleSheet.absoluteFillObject },
  loadingText: {
    marginTop: 20,
    textAlign: "center",
    color: "#212121",
    fontSize: 16,
  },
  errorText: {
    marginTop: 20,
    textAlign: "center",
    color: "red",
    fontSize: 16,
  },

  // Floating Refresh Button (Universal refresh/re-search)
  refreshFloatingButton: {
    position: "absolute",
    top: 100, // Below the header
    right: 20,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 50,
    padding: 12, // Increased padding for a slightly larger touch target
    zIndex: 15,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },

  // ------------------ Floating Card Styles ------------------
  // Action Card (Before Search or if Search failed)
  actionCard: {
    position: "absolute",
    top: height * 0.15, // Move it down a bit from the top
    left: 20,
    right: 20,
    zIndex: 10,
    borderRadius: 12,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  actionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: PRIMARY_COLOR,
    textAlign: "center",
  },
  actionParagraph: {
    fontSize: 14,
    color: SECONDARY_TEXT_COLOR,
    textAlign: "center",
    marginBottom: 15,
  },
  findButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 8,
    paddingVertical: 5,
  },
  findButtonLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  // Info Card (After Search)
  infoCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  infoDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  detailText: {
    fontSize: 14,
    color: SECONDARY_TEXT_COLOR,
    marginLeft: 5,
  },
  infoActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  newSearchButton: {
    flex: 1,
    marginRight: 10,
    borderColor: DANGER_COLOR,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 5,
  },
  newSearchButtonLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: DANGER_COLOR,
  },
  callButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 5,
    borderRadius: 8,
  },
  callButtonLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: PRIMARY_COLOR,
    zIndex: 20,
  },
  logoContainer: { flexDirection: "row" },
  logoText: { fontSize: 26, fontWeight: "bold", color: "#FFFFFF", top: 10 },
  profileIcon: { padding: 5, top: 10 },
});
