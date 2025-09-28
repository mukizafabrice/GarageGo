import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
// Import Polyline for drawing the route
import MapView, { Marker, Polyline } from "react-native-maps";
// Removed MapViewDirections import
import * as Notifications from "expo-notifications";
import { getGarageByUserId } from "../../services/garageService";
import { useAuth } from "../../context/AuthContext";
// Import Axios and the polyline decoder
import axios from "axios";
import { decode as decodePolyline } from "@mapbox/polyline";

// NOTE: GOOGLE_MAPS_API_KEY is removed as per your request

// Define the OSRM public server URL for routing
const OSRM_ROUTING_URL = "http://router.project-osrm.org/route/v1/driving/";

const GarageMapScreen = () => {
  const [garageLocation, setGarageLocation] = useState(null);
  const [garageInfo, setGarageInfo] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]); // NEW state for the route
  const [isLoading, setIsLoading] = useState(true);

  const mapRef = useRef(null);

  const { user } = useAuth();
  const userId = user?._id;

  // Function to fetch and decode the driving route
  const fetchRoute = async (origin, destination) => {
    if (!origin || !destination) return;

    // OSRM API uses Longitude, Latitude order
    const osrmUrl =
      `${OSRM_ROUTING_URL}${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}` +
      `?overview=full&geometries=polyline`;

    try {
      const response = await axios.get(osrmUrl);
      const polyline = response.data.routes[0].geometry;

      const decodedCoords = decodePolyline(polyline).map((point) => ({
        latitude: point[0],
        longitude: point[1],
      }));

      setRouteCoordinates(decodedCoords);
    } catch (error) {
      console.error("Error fetching OSRM route:", error);
      setRouteCoordinates([]); // Clear route on error
    }
  };

  // 1. Fetch garage data (same as before)
  useEffect(() => {
    // ... (Your existing fetchGarage logic remains here)
    const fetchGarage = async () => {
      if (!userId) return setIsLoading(false);

      try {
        const response = await getGarageByUserId(userId);
        const data = response.data;

        if (data.latitude != null && data.longitude != null) {
          const coords = {
            latitude: parseFloat(data.latitude),
            longitude: parseFloat(data.longitude),
          };
          setGarageLocation(coords);
          setGarageInfo({ name: data.name, address: data.address });

          mapRef.current?.animateToRegion(
            {
              ...coords,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            },
            1000
          );
        }
      } catch (err) {
        console.error("Error fetching garage location:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGarage();
    // ... (end of existing logic)
  }, [userId]);

  // 2. Listen for driver coordinates AND fetch route
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notif) => {
        const { driverLat, driverLng } = notif.request.content.data || {};
        if (driverLat && driverLng) {
          const newDriverLocation = {
            latitude: parseFloat(driverLat),
            longitude: parseFloat(driverLng),
          };
          setDriverLocation(newDriverLocation);

          // Only fetch route if garage location is already known
          if (garageLocation) {
            fetchRoute(garageLocation, newDriverLocation);
          }

          // Zoom map to include both points (same as before)
          if (garageLocation && mapRef.current) {
            mapRef.current.fitToCoordinates(
              [garageLocation, newDriverLocation],
              {
                edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
                animated: true,
              }
            );
          }
        }
      }
    );

    return () => subscription.remove();
  }, [garageLocation]); // Dependency on garageLocation is crucial here

  // 3. Re-fetch route if garageLocation is set AFTER initial render (e.g. if driver was first)
  // This is a safety check, though the logic above should cover most cases.
  useEffect(() => {
    if (garageLocation && driverLocation) {
      fetchRoute(garageLocation, driverLocation);
    }
  }, [garageLocation, driverLocation]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading garage location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: garageLocation?.latitude || 0,
          longitude: garageLocation?.longitude || 0,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {garageLocation && (
          <Marker
            coordinate={garageLocation}
            title={garageInfo?.name || "Garage"}
            description={garageInfo?.address || ""}
            pinColor="blue"
          />
        )}

        {driverLocation && (
          <Marker coordinate={driverLocation} title="Driver" pinColor="red" />
        )}

        {/* 4. Draw the route using Polyline and the fetched coordinates */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={4}
            strokeColor="green"
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 16, color: "#555" },
});

export default GarageMapScreen;
