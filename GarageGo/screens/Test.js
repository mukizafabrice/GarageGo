import React, { useState } from "react";
import { View, Text, Button, StyleSheet, Alert } from "react-native";
import * as Location from "expo-location";

const App = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError(
          "Location permission denied. Please enable it in your device settings."
        );
        setLoading(false);
        return;
      }

      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        timestamp: currentLocation.timestamp,
      });
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Get Your GPS Coordinates</Text>

      <Button
        title={loading ? "Fetching Location..." : "Get My Location"}
        onPress={getCurrentLocation}
        disabled={loading}
      />

      {error && <Text style={[styles.text, styles.errorText]}>{error}</Text>}

      {location && (
        <View style={styles.locationContainer}>
          <Text style={styles.text}>Latitude: {location.latitude}</Text>
          <Text style={styles.text}>Longitude: {location.longitude}</Text>
          <Text style={styles.text}>
            Timestamp: {new Date(location.timestamp).toLocaleString()}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  locationContainer: {
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: "100%",
    alignItems: "center",
  },
  text: {
    fontSize: 16,
    marginBottom: 5,
    color: "#555",
  },
  errorText: {
    color: "red",
    marginTop: 10,
    textAlign: "center",
  },
});

export default App;
