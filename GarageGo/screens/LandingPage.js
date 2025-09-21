import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, SafeAreaView } from "react-native";
import { Button, Tab, Tabs } from "react-native-paper";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location"; // GPS

// Screen Dimensions
const { width, height } = Dimensions.get("window");

const LandingPage = () => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [activeTab, setActiveTab] = useState(0); // 0: Map, 1: List, 2: Profile
  const [garages, setGarages] = useState([
    // Example garage data
    { id: 1, name: "Super Garage", latitude: 1.9577, longitude: 30.0913 },
    { id: 2, name: "Quick Fix", latitude: 1.95, longitude: 30.08 },
  ]);

  // Request user location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Tabs */}
      <View style={styles.topTabs}>
        <Button
          mode={activeTab === 0 ? "contained" : "text"}
          onPress={() => setActiveTab(0)}
          style={activeTab === 0 ? styles.activeTab : styles.tabButton}
        >
          Map
        </Button>
        <Button
          mode={activeTab === 1 ? "contained" : "text"}
          onPress={() => setActiveTab(1)}
          style={activeTab === 1 ? styles.activeTab : styles.tabButton}
        >
          List
        </Button>
        <Button
          mode={activeTab === 2 ? "contained" : "text"}
          onPress={() => setActiveTab(2)}
          style={activeTab === 2 ? styles.activeTab : styles.tabButton}
        >
          Profile
        </Button>
      </View>

      {/* Content */}
      {activeTab === 0 && (
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
            >
              {garages.map((garage) => (
                <Marker
                  key={garage.id}
                  coordinate={{
                    latitude: garage.latitude,
                    longitude: garage.longitude,
                  }}
                  title={garage.name}
                />
              ))}
            </MapView>
          ) : (
            <Text style={styles.loadingText}>
              {errorMsg || "Loading map..."}
            </Text>
          )}
        </View>
      )}

      {activeTab === 1 && (
        <View style={styles.listContainer}>
          {garages.map((garage) => (
            <Text key={garage.id} style={styles.garageItem}>
              {garage.name}
            </Text>
          ))}
        </View>
      )}

      {activeTab === 2 && (
        <View style={styles.profileContainer}>
          <Text style={styles.profileText}>User Profile Section</Text>
        </View>
      )}

      {/* Action Button */}
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={() => console.log("Find Garage pressed")}
          style={styles.findButton}
          contentStyle={{ paddingVertical: 10 }}
        >
          Find Garage
        </Button>
      </View>
    </SafeAreaView>
  );
};

export default LandingPage;

// --------------------- Styles ---------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  topTabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    backgroundColor: "#1F1F1F",
  },
  tabButton: {
    backgroundColor: "#1F1F1F",
    color: "#FFFFFF",
  },
  activeTab: {
    backgroundColor: "#7B2FCE",
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: width,
    height: height * 0.65,
  },
  loadingText: {
    marginTop: 20,
    textAlign: "center",
    color: "#212121",
    fontSize: 16,
  },
  listContainer: {
    flex: 1,
    padding: 20,
  },
  garageItem: {
    fontSize: 18,
    marginBottom: 15,
    color: "#212121",
  },
  profileContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileText: {
    fontSize: 20,
    color: "#212121",
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#F5F5F5",
  },
  findButton: {
    backgroundColor: "#7B2FCE",
  },
});
