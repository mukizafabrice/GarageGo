import React, { useState, useEffect } from "react";
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
import MapView from "react-native-maps";
import * as Location from "expo-location";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

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
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  // Request location permission and initial location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Permission to access location was denied");
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
      } catch (err) {
        console.error(err);
        setError("Error getting location");
      }
    })();
  }, []);

  const handleProfilePress = () => {
    navigation.navigate("Login");
  };

  // Show alert with current coordinates
  const handleFindPress = () => {
    if (!location) {
      Alert.alert("Location not available", "Please allow location access.");
      return;
    }
    Alert.alert(
      "Current Coordinates",
      `Latitude: ${location.latitude}\nLongitude: ${location.longitude}`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header onProfilePress={handleProfilePress} />

      <View style={styles.mapContainer}>
        {location ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation={true}
          />
        ) : (
          <Text style={styles.loadingText}>{error || "Loading map..."}</Text>
        )}

        <View style={styles.findButtonContainer}>
          <Button
            mode="contained"
            onPress={handleFindPress} // ✅ alert logic
            style={styles.findButton}
          >
            Find
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
