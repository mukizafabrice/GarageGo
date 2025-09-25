import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Button } from "react-native-paper";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { findNearestGarage } from "../services/garageService.js";
import axios from "axios";
import { decode as decodePolyline } from "@mapbox/polyline";

// Screen Dimensions
const { width, height } = Dimensions.get("window");

// Custom Header Component
const Header = ({ onProfilePress }) => (
  <View style={headerStyles.container}>
    <View style={headerStyles.logoContainer}>
      <Text style={headerStyles.logoText}>GarageGo</Text>
    </View>
    <TouchableOpacity onPress={onProfilePress} style={headerStyles.profileIcon}>
      <Ionicons name="person-circle-outline" size={28} color="#FFFFFF" />
    </TouchableOpacity>
  </View>
);

const LandingPage = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [nearestGarage, setNearestGarage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const navigation = useNavigation();

  // Reference for the MapView component to control its view
  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Permission to access location was denied");
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation(loc.coords);
      } catch (err) {
        console.error(err);
        setError("Error getting location");
      }
    })();
  }, []);

  const handleProfilePress = () => {
    navigation.navigate("Login");
  };

  const handleFindPress = async () => {
    if (!userLocation) {
      Alert.alert("Location not available", "Please allow location access.");
      return;
    }

    setLoading(true);
    setRouteCoordinates([]);
    setNearestGarage(null);

    try {
      const response = await findNearestGarage(
        userLocation.latitude,
        userLocation.longitude
      );

      if (response.success && response.nearestGarage) {
        const garage = response.nearestGarage;
        setNearestGarage(garage);
        Alert.alert("Success", `Nearest garage found: ${garage.name}`);

        const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${userLocation.longitude},${userLocation.latitude};${garage.longitude},${garage.latitude}?overview=full&geometries=polyline`;

        const routeResponse = await axios.get(osrmUrl);
        const polyline = routeResponse.data.routes[0].geometry;
        const decodedCoords = decodePolyline(polyline).map((point) => ({
          latitude: point[0],
          longitude: point[1],
        }));

        setRouteCoordinates(decodedCoords);

        // Adjust map view to fit both markers and the route
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
              edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
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
        "Could not connect to the server or routing service."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header onProfilePress={handleProfilePress} />
      <View style={styles.mapContainer}>
        {userLocation ? (
          <MapView
            ref={mapRef} // Set the ref here
            style={styles.map}
            initialRegion={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
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
                description="Nearest Garage"
                pinColor="blue"
              />
            )}

            {/* Draw the route using a Polyline */}
            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeWidth={5}
                strokeColor="red"
              />
            )}
          </MapView>
        ) : (
          <Text style={styles.loadingText}>{error || "Loading map..."}</Text>
        )}
        <View style={styles.findButtonContainer}>
          <Button
            mode="contained"
            onPress={handleFindPress}
            style={styles.findButton}
            loading={loading}
            disabled={loading}
          >
            {loading ? "Finding..." : "Find Nearest Garage"}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default LandingPage;

// --------------------- Styles ---------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F0F0" },
  mapContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  map: { width: "100%", height: "100%" },
  loadingText: {
    marginTop: 20,
    textAlign: "center",
    color: "#212121",
    fontSize: 16,
  },
  findButtonContainer: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
  },
  findButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 25,
    paddingHorizontal: 20,
  },
});

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#4CAF50",
  },
  logoContainer: { flexDirection: "row", top: 10 },
  logoText: { fontSize: 24, fontWeight: "bold", color: "#FFFFFF" },
  profileIcon: { padding: 5, top: 10 },
});
