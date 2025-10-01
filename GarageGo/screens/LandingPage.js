import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button, Card, Title, Paragraph } from "react-native-paper";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { findNearestGarage } from "../services/garageService.js";
import axios from "axios";
import { decode as decodePolyline } from "@mapbox/polyline";

// --- CONFIGURATION CONSTANTS ---
const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.05;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const PRIMARY_COLOR = "#4CAF50"; // Green brand color
const SECONDARY_TEXT_COLOR = "#757575";
const DANGER_COLOR = "#D32F2F"; // Red for secondary actions

// Configure Notification Handler to show alerts in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// --- CUSTOM HEADER COMPONENT ---
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

// --- MAIN COMPONENT ---
const LandingPage = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [nearestGarage, setNearestGarage] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); // Initial load (for location)
  const [findingGarage, setFindingGarage] = useState(false); // Button loading state
  const [userData, setUserData] = useState(null);

  const mapRef = useRef(null);
  const navigation = useNavigation();

  // --- HANDLER FUNCTIONS ---

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
    setError(null);

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

  // Function to schedule a notification
  const scheduleGarageFoundNotification = async (garageName) => {
    try {
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

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "✅ Nearest Garage Found!",
          body: `We located: ${garageName}. Tap to view details.`,
          data: { garageName: garageName },
          sound: true,
        },
        trigger: { seconds: 1 },
      });

      console.log(
        `[Notification] Successfully requested scheduling for: ${garageName}`
      );
    } catch (e) {
      console.error("Error scheduling notification:", e);
    }
  };

  // Helper function to fetch route and adjust map view
  const fetchRouteAndAdjustMap = async (userLoc, garage) => {
    // -----------------------------------------------------------
    // ✅ FIX: VALIDATION CHECK FOR OSRM 400 ERROR
    if (
      !userLoc ||
      !garage ||
      !userLoc.latitude ||
      !userLoc.longitude ||
      !garage.latitude ||
      !garage.longitude
    ) {
      console.error(
        "Route Error: Missing or invalid location data. Aborting OSRM request."
      );
      Alert.alert(
        "Route Error",
        "Missing user or garage coordinates to plot route."
      );
      setRouteCoordinates([]);
      return; // EXIT if data is missing
    }
    // -----------------------------------------------------------

    // OSRM requires LON, LAT order
    const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${userLoc.longitude},${userLoc.latitude};${garage.longitude},${garage.latitude}?overview=full&geometries=polyline`;

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

      let errorMessage = "Could not calculate driving route.";
      if (
        axios.isAxiosError(routeError) &&
        routeError.response?.status === 400
      ) {
        errorMessage =
          "Routing error: Invalid coordinate data used for the route calculation.";
      }

      Alert.alert("Route Error", errorMessage);
      setRouteCoordinates([]);
    }
  };

  // Unified Location Fetch and Search Logic
  const fetchLocationAndSearch = async () => {
    setFindingGarage(true);
    setNearestGarage(null);
    setRouteCoordinates([]);
    setError(null);

    try {
      // 1. Get User Location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location access denied. Please enable location services.");
        setFindingGarage(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const currentLocation = loc.coords;
      setUserLocation(currentLocation);

      // If user data is missing, prompt to log in/register
      if (!userData?.name || !userData?.phoneNumber) {
        Alert.alert(
          "User Data Missing",
          "Please log in or register to connect with a garage.",
          [{ text: "OK", onPress: handleProfilePress }]
        );
        return;
      }

      // 2. Find Nearest Garage
      const response = await findNearestGarage(
        currentLocation.latitude,
        currentLocation.longitude,
        userData.name,
        userData.phoneNumber
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
      setFindingGarage(false);
    }
  };

  // --- USE EFFECTS ---

  // 1. Initial Location Fetch and User Data Load
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Fetch User Data
        const storedName = await AsyncStorage.getItem("user_registration_name");
        const storedPhone = await AsyncStorage.getItem(
          "user_registration_phone"
        );
        if (storedName && storedPhone) {
          setUserData({ name: storedName, phoneNumber: storedPhone });
        }

        // Fetch Initial Location
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
        console.error("Initialization Error:", err);
        setError("Error getting location. Please check settings.");
      } finally {
        setLoading(false);
      }
    };
    initializeApp();
  }, []);

  // 2. Notification Listeners
  useEffect(() => {
    // Listener for notifications received while the app is in the foreground
    const receivedListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        // Critical Filter: Ignore driver/tracking notifications meant for the Garage App
        const data = notification.request.content.data || {};
        if (data.driverLat || data.driverLng) {
          console.log("Consumer Listener: IGNORING driver location update.");
          return;
        }
        console.log(
          "[Notification Received] App is in the foreground:",
          notification.request.content.title
        );
      }
    );

    // Listener for when a user taps on the notification
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const garageName =
          response.notification.request.content.data.garageName;
        console.log(
          "[Notification Tapped] User opened app via notification for:",
          garageName
        );
        // Implement navigation logic here if desired
      });

    // Clean up listeners
    return () => {
      if (receivedListener) {
        receivedListener.remove();
      }
      if (responseListener) {
        responseListener.remove();
      }
    };
  }, []);

  // --- RENDER CONTENT ---

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
        {userLocation || error ? (
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
                strokeColor={PRIMARY_COLOR}
              />
            )}
          </MapView>
        ) : (
          <Text style={styles.errorText}>
            {error || "Map not available. Check location permissions."}
          </Text>
        )}

        {/* REFRESH/RE-SEARCH BUTTON (Floating) */}
        <TouchableOpacity
          style={styles.refreshFloatingButton}
          onPress={fetchLocationAndSearch}
          disabled={findingGarage || loading}
        >
          {findingGarage ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="refresh" size={28} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        {/* TOP ACTION CARD (Before Search) */}
        {!nearestGarage && (
          <Card style={styles.actionCard}>
            <Card.Content>
              <Title style={styles.actionTitle}>Need a Fix?</Title>
              <Paragraph style={styles.actionParagraph}>
                Tap the button to instantly locate the closest available garage.
              </Paragraph>
              <Button
                mode="contained"
                onPress={fetchLocationAndSearch}
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

        {/* BOTTOM INFO CARD (After Search) */}
        {nearestGarage && (
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
                    Rating: {nearestGarage.rating || "N/A"}
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

// --- STYLES ---

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
    padding: 20,
    textAlign: "center",
    color: DANGER_COLOR,
    fontSize: 16,
    backgroundColor: "white",
  },

  // Floating Refresh Button
  refreshFloatingButton: {
    position: "absolute",
    top: 100,
    right: 20,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 50,
    padding: 12,
    zIndex: 15,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },

  // Floating Card Styles
  actionCard: {
    position: "absolute",
    top: height * 0.15,
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
    paddingHorizontal: 15,
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
    paddingHorizontal: 5,
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
    backgroundColor: "#007AFF", // Blue for a call action
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
