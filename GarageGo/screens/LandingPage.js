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

// Define Constants for Styling
const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.05;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const PRIMARY_COLOR = "#4CAF50"; // Green brand color
const SECONDARY_TEXT_COLOR = "#757575";

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
  const [loading, setLoading] = useState(true); // Start loading true to fetch location
  const [findingGarage, setFindingGarage] = useState(false);

  const mapRef = useRef(null);
  const navigation = useNavigation();

  // ------------------ Location Fetch Effect ------------------
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Location access denied. Map cannot show current position.");
          setLoading(false);
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

  const handleProfilePress = () => {
    // Navigate to Login or Profile screen
    navigation.navigate("Login");
  };

  const handleCallGarage = () => {
    if (nearestGarage?.phone) {
      Linking.openURL(`tel:${nearestGarage.phone}`);
    } else {
      Alert.alert("Error", "Garage phone number not available.");
    }
  };

  // ------------------ Main Action Handler ------------------
  const handleFindPress = async () => {
    if (!userLocation) {
      Alert.alert(
        "Location Not Ready",
        "Please wait for your location or check permissions."
      );
      return;
    }

    setFindingGarage(true);
    setRouteCoordinates([]);
    setNearestGarage(null);

    try {
      // 1. Find Nearest Garage
      const response = await findNearestGarage(
        userLocation.latitude,
        userLocation.longitude
      );

      if (response.success && response.nearestGarage) {
        const garage = response.nearestGarage;
        setNearestGarage(garage);

        // 2. Fetch OSRM Route
        // OSRM requires LON, LAT order
        const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${userLocation.longitude},${userLocation.latitude};${garage.longitude},${garage.latitude}?overview=full&geometries=polyline`;

        const routeResponse = await axios.get(osrmUrl);
        const polyline = routeResponse.data.routes[0].geometry;
        const decodedCoords = decodePolyline(polyline).map((point) => ({
          latitude: point[0],
          longitude: point[1],
        }));

        setRouteCoordinates(decodedCoords);

        // 3. Adjust map view
        if (mapRef.current) {
          mapRef.current.fitToCoordinates(
            [
              {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              },
              { latitude: garage.latitude, longitude: garage.longitude },
              ...decodedCoords,
            ],
            {
              edgePadding: { top: 150, right: 50, bottom: 200, left: 50 }, // Adjusted padding for UI cards
              animated: true,
            }
          );
        }
      } else {
        Alert.alert(
          "Error",
          response.message || "Failed to find nearest garage."
        );
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      Alert.alert(
        "Error",
        "Could not connect to the service. Please try again."
      );
    } finally {
      setFindingGarage(false);
    }
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

        {/* --------------------- TOP ACTION CARD --------------------- */}
        {!nearestGarage && ( // Show only before a garage is found
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

              <Button
                mode="contained"
                icon="phone"
                onPress={handleCallGarage}
                style={styles.callButton}
                labelStyle={styles.callButtonLabel}
              >
                Call Now
              </Button>
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

  // ------------------ Floating Card Styles ------------------
  // Action Card (Before Search)
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
  callButton: {
    marginTop: 10,
    backgroundColor: "#007AFF", // Using a distinct blue for 'Call Now'
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
    paddingVertical: 10, // Adjusted padding
    backgroundColor: PRIMARY_COLOR,
    zIndex: 20, // Ensure header is above everything
  },
  logoContainer: { flexDirection: "row" },
  logoText: { fontSize: 26, fontWeight: "bold", color: "#FFFFFF" },
  profileIcon: { padding: 5 },  
});
