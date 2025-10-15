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
import { findNearestGarage, findNearbyGarages, sendRequestToGarage } from "../services/garageService.js";
import { openWhatsAppWithGarage } from "../utils/whatsapp.js";
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
  const [nearbyGarages, setNearbyGarages] = useState([]);
  const [selectedGarage, setSelectedGarage] = useState(null);
  const [showGarageSelection, setShowGarageSelection] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); // Initial load (for location)
  const [findingGarage, setFindingGarage] = useState(false); // Button loading state
  const [sendingRequest, setSendingRequest] = useState(false); // Request sending state
  const [userData, setUserData] = useState(null);
  const [userFcmToken, setUserFcmToken] = useState(null);

  const mapRef = useRef(null);
  const navigation = useNavigation();

  // --- HANDLER FUNCTIONS ---

  const handleProfilePress = () => {
    navigation.navigate("Login");
  };

  // Request and store FCM token for the user
  const requestUserFcmToken = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus === "granted") {
        // Get the FCM token
        const tokenData = await Notifications.getExpoPushTokenAsync();
        const token = tokenData.data;

        // Store in AsyncStorage
        await AsyncStorage.setItem("user_fcm_token", token);
        setUserFcmToken(token);

        console.log("User FCM token stored:", token);
      } else {
        console.log("Notification permission denied for user");
      }
    } catch (error) {
      console.error("Error getting FCM token:", error);
    }
  };

  const handleCallGarage = () => {
    if (nearestGarage?.phone) {
      Linking.openURL(`tel:${nearestGarage.phone}`);
    } else {
      Alert.alert("Error", "Garage phone number not available.");
    }
  };

  const handleWhatsAppGarage = () => {
    if (nearestGarage && userData?.name && userData?.phoneNumber) {
      openWhatsAppWithGarage(nearestGarage, userData.name, userData.phoneNumber);
    } else {
      Alert.alert("Error", "Garage information or user data not available.");
    }
  };

  // Function to clear the search results and return to the default state
  const handleNewSearch = () => {
    setNearestGarage(null);
    setNearbyGarages([]);
    setSelectedGarage(null);
    setShowGarageSelection(false);
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

  // Handle garage selection from the list
  const handleGarageSelection = (garage) => {
    setSelectedGarage(garage);
    setShowGarageSelection(false);
    setNearestGarage(garage);
    
    // Fetch route to selected garage
    if (userLocation) {
      fetchRouteAndAdjustMap(userLocation, garage);
    }
  };

  // Send request to the selected garage
  const handleSendRequest = async () => {
    if (!selectedGarage || !userData?.name || !userData?.phoneNumber) {
      Alert.alert("Error", "Missing garage selection or user data.");
      return;
    }

    setSendingRequest(true);
    try {
      const response = await sendRequestToGarage(
        selectedGarage.id,
        userLocation.latitude,
        userLocation.longitude,
        userData.name,
        userData.phoneNumber,
        userFcmToken // Include user's FCM token for reverse notifications
      );

      if (response.success) {
        Alert.alert(
          "Request Sent!",
          `Your request has been sent to ${selectedGarage.name}. They will contact you shortly.`,
          [{ text: "OK", onPress: handleNewSearch }]
        );

        // Schedule notification
        scheduleGarageFoundNotification(selectedGarage.name);
      } else {
        Alert.alert("Error", response.message || "Failed to send request.");
      }
    } catch (error) {
      console.error("Error sending request:", error);
      Alert.alert("Error", "Failed to send request. Please try again.");
    } finally {
      setSendingRequest(false);
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
    setNearbyGarages([]);
    setSelectedGarage(null);
    setShowGarageSelection(false);
    setRouteCoordinates([]);
    setError(null);

    try {
      // 1. Check Location Services
      const locationServicesEnabled = await Location.hasServicesEnabledAsync();
      if (!locationServicesEnabled) {
        Alert.alert(
          "Location Services Disabled",
          "Please enable location services in your device settings to find nearby garages.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => Linking.openURL("app-settings:")
            }
          ]
        );
        setFindingGarage(false);
        return;
      }

      // 2. Request Location Permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Permission Required",
          "Location permission is needed to find nearby garages. Please grant permission in your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => Linking.openURL("app-settings:")
            }
          ]
        );
        setFindingGarage(false);
        return;
      }

      // 3. Get User Location with Fallback Accuracy
      let currentLocation;
      try {
        // Try high accuracy first
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeout: 15000, // 15 second timeout
        });
        currentLocation = loc.coords;
        console.log("High accuracy location obtained:", currentLocation);
      } catch (highAccuracyError) {
        console.warn("High accuracy failed, trying balanced:", highAccuracyError);
        try {
          // Fallback to balanced accuracy
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeout: 10000, // 10 second timeout
          });
          currentLocation = loc.coords;
          console.log("Balanced accuracy location obtained:", currentLocation);
        } catch (balancedError) {
          console.error("Both accuracy modes failed:", balancedError);
          Alert.alert(
            "Location Error",
            "Unable to get your location. Please check your GPS signal and try again.",
            [{ text: "OK", style: "default" }]
          );
          setFindingGarage(false);
          return;
        }
      }

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

      // 2. Find Nearby Garages (without notifications)
      const response = await findNearbyGarages(
        currentLocation.latitude,
        currentLocation.longitude,
        25, // 25km radius
        10, // limit to 10 garages
        false, // don't send notifications yet
        null,
        null
      );

      if (response.success && response.data.garages.length > 0) {
        const garages = response.data.garages;
        setNearbyGarages(garages);
        setShowGarageSelection(true);
        
        // Show the first garage as default selection
        if (garages.length > 0) {
          setSelectedGarage(garages[0]);
          setNearestGarage(garages[0]);
          await fetchRouteAndAdjustMap(currentLocation, garages[0]);
        }
      } else {
        Alert.alert(
          "No Garages Found",
          response.message || "No garages found within 25km of your location."
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

  // 1. Initial App Setup (User Data & FCM Token Only)
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Fetch User Data (safe operation)
        const storedName = await AsyncStorage.getItem("user_registration_name");
        const storedPhone = await AsyncStorage.getItem("user_registration_phone");
        const storedFcmToken = await AsyncStorage.getItem("user_fcm_token");

        if (storedName && storedPhone) {
          setUserData({ name: storedName, phoneNumber: storedPhone });
        }

        if (storedFcmToken) {
          setUserFcmToken(storedFcmToken);
        }

        // Request FCM token if not already stored (safe operation)
        if (!storedFcmToken) {
          await requestUserFcmToken();
        }

        // NOTE: Location is now requested only when user taps "Find Nearby Garages"
        // This prevents app crashes when location permission is denied

      } catch (err) {
        console.error("Initialization Error:", err);
        setError("Failed to initialize app. Please restart.");
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
        <Text style={styles.loadingText}>Loading GarageGo...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header onProfilePress={handleProfilePress} />

      <View style={styles.mapContainer}>
        {/* MAP VIEW */}
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
              : {
                  // Default to a general location if no user location (e.g., Kigali, Rwanda)
                  latitude: -1.9579,
                  longitude: 30.1127,
                  latitudeDelta: LATITUDE_DELTA,
                  longitudeDelta: LONGITUDE_DELTA,
                }
          }
          showsUserLocation={userLocation ? true : false}
        >
            {/* Markers for all nearby garages */}
            {nearbyGarages.map((garage, index) => (
              <Marker
                key={garage.id}
                coordinate={{
                  latitude: garage.latitude,
                  longitude: garage.longitude,
                }}
                title={garage.name}
                description={`${garage.distance}km away`}
                pinColor={selectedGarage?.id === garage.id ? "red" : "blue"}
                onPress={() => handleGarageSelection(garage)}
              />
            ))}

            {/* Draw the route */}
            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeWidth={5}
                strokeColor={PRIMARY_COLOR}
              />
            )}
          </MapView>
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
                Tap the button to find nearby garages and choose the best one for you.
              </Paragraph>
              <Button
                mode="contained"
                onPress={fetchLocationAndSearch}
                style={styles.findButton}
                labelStyle={styles.findButtonLabel}
                loading={findingGarage}
                disabled={findingGarage || !userLocation}
              >
                {findingGarage ? "Searching..." : "Find Nearby Garages"}
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* GARAGE SELECTION CARD */}
        {showGarageSelection && nearbyGarages.length > 0 && (
          <Card style={styles.selectionCard}>
            <Card.Content>
              <Title style={styles.selectionTitle}>
                <Ionicons name="list-outline" size={20} color={PRIMARY_COLOR} />{" "}
                Choose a Garage ({nearbyGarages.length} found)
              </Title>
              <View style={styles.garageList}>
                {nearbyGarages.slice(0, 3).map((garage) => (
                  <TouchableOpacity
                    key={garage.id}
                    style={[
                      styles.garageItem,
                      selectedGarage?.id === garage.id && styles.selectedGarageItem
                    ]}
                    onPress={() => handleGarageSelection(garage)}
                  >
                    <View style={styles.garageInfo}>
                      <Text style={styles.garageName}>{garage.name}</Text>
                      <Text style={styles.garageDistance}>{garage.distance}km away</Text>
                      <Text style={styles.garageAddress} numberOfLines={1}>
                        {garage.address || "Address not available"}
                      </Text>
                    </View>
                    <Ionicons 
                      name={selectedGarage?.id === garage.id ? "radio-button-on" : "radio-button-off"} 
                      size={20} 
                      color={selectedGarage?.id === garage.id ? PRIMARY_COLOR : "#ccc"} 
                    />
                  </TouchableOpacity>
                ))}
                {nearbyGarages.length > 3 && (
                  <Text style={styles.moreGaragesText}>
                    +{nearbyGarages.length - 3} more garages available
                  </Text>
                )}
              </View>
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

                {/* SEND REQUEST BUTTON */}
                <Button
                  mode="contained"
                  icon="send"
                  onPress={handleSendRequest}
                  style={styles.sendRequestButton}
                  labelStyle={styles.sendRequestButtonLabel}
                  loading={sendingRequest}
                  disabled={sendingRequest}
                >
                  {sendingRequest ? "Sending..." : "Send Request"}
                </Button>
              </View>

              <View style={styles.contactActions}>
                {/* WHATSAPP BUTTON */}
                <Button
                  mode="contained"
                  icon="chat"
                  onPress={handleWhatsAppGarage}
                  style={styles.whatsappButton}
                  labelStyle={styles.whatsappButtonLabel}
                >
                  WhatsApp
                </Button>

                {/* CALL BUTTON */}
                <Button
                  mode="outlined"
                  icon="phone"
                  onPress={handleCallGarage}
                  style={styles.callButton}
                  labelStyle={styles.callButtonLabel}
                >
                  Call
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
    marginRight: 5,
    borderColor: DANGER_COLOR,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 5,
  },
  newSearchButtonLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: DANGER_COLOR,
  },
  sendRequestButton: {
    flex: 2,
    marginLeft: 5,
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 5,
    borderRadius: 8,
  },
  sendRequestButtonLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  contactActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  whatsappButton: {
    flex: 1,
    marginRight: 5,
    backgroundColor: "#25D366", // WhatsApp green color
    paddingVertical: 5,
    borderRadius: 8,
  },
  whatsappButtonLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  callButton: {
    flex: 1,
    marginLeft: 5,
    borderColor: "#007AFF",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 5,
  },
  callButtonLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#007AFF",
  },

  // Garage Selection Card Styles
  selectionCard: {
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
    maxHeight: height * 0.4,
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: PRIMARY_COLOR,
    textAlign: "center",
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  garageList: {
    maxHeight: height * 0.25,
  },
  garageItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginVertical: 2,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  selectedGarageItem: {
    backgroundColor: "#e8f5e8",
    borderColor: PRIMARY_COLOR,
    borderWidth: 2,
  },
  garageInfo: {
    flex: 1,
    marginRight: 10,
  },
  garageName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 2,
  },
  garageDistance: {
    fontSize: 14,
    color: PRIMARY_COLOR,
    fontWeight: "600",
    marginBottom: 2,
  },
  garageAddress: {
    fontSize: 12,
    color: SECONDARY_TEXT_COLOR,
  },
  moreGaragesText: {
    textAlign: "center",
    fontSize: 12,
    color: SECONDARY_TEXT_COLOR,
    fontStyle: "italic",
    marginTop: 10,
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
