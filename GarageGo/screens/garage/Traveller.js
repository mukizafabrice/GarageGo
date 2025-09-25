import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import { Appbar, Card } from "react-native-paper";
import MapView, { Marker } from "react-native-maps";
import { getGarageByUserId } from "../../services/garageService";
import { useAuth } from "../../context/AuthContext"; // ✅ useAuth for logged user

const DriverLocationScreen = () => {
  const [garageLocation, setGarageLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth(); // ✅ user comes from AuthContext
  const userId = user?._id; // assuming backend returns _id for logged-in user

  useEffect(() => {
    const fetchGarage = async () => {
      if (!userId) {
        console.warn("No userId found in AuthContext");
        setIsLoading(false);
        return;
      }

      try {
        const data = await getGarageByUserId(userId);
        // console.log(data);
        // if (data.latitude && data.longitude) {
        //   setGarageLocation({
        //     latitude: parseFloat(data.latitude),
        //     longitude: parseFloat(data.longitude),
        //   });
        // } else {
        //   console.warn("Garage data missing latitude/longitude:", data);
        // }
      } catch (error) {
        console.error("Error fetching garage location:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGarage();
  }, [userId]);

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
      <Appbar.Header style={styles.appBar}>
        <Appbar.Content
          title={"Garage Location Map"}
          titleStyle={styles.appBarTitle}
        />
      </Appbar.Header>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={
            garageLocation
              ? {
                  latitude: garageLocation.latitude,
                  longitude: garageLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }
              : {
                  latitude: 37.78825,
                  longitude: -122.4324,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }
          }
        >
          {garageLocation && (
            <Marker
              coordinate={garageLocation}
              title="Garage Location"
              description="Your garage"
              pinColor="blue"
            />
          )}
        </MapView>
      </View>

      <View style={styles.infoCard}>
        <Card style={styles.card}>
          <Card.Content>
            {garageLocation ? (
              <View>
                <Text style={styles.cardText}>Garage Coordinates:</Text>
                <Text>
                  Lat: {garageLocation.latitude.toFixed(6)}, Lng:{" "}
                  {garageLocation.longitude.toFixed(6)}
                </Text>
              </View>
            ) : (
              <Text style={styles.cardText}>No garage location available.</Text>
            )}
          </Card.Content>
        </Card>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#555",
  },
  appBar: {
    backgroundColor: "#4CAF50",
  },
  appBarTitle: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  mapContainer: {
    flex: 1,
    overflow: "hidden",
    alignSelf: "stretch",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  infoCard: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  card: {
    borderRadius: 10,
    elevation: 4,
  },
  cardText: {
    fontWeight: "bold",
    marginBottom: 5,
  },
});

export default DriverLocationScreen;
