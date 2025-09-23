import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, ScrollView, Text } from "react-native";
import {
  Appbar,
  Card,
  Button,
  TextInput,
  Modal,
  List,
  Divider,
} from "react-native-paper";
import * as Location from "expo-location";
import DropDownPicker from "react-native-dropdown-picker";
import { fetchUsers } from "../../services/AuthService";
import { addGarage } from "../../services/garageService";

const AddGarageScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    services: "",
    latitude: "",
    longitude: "",
    address: "",
    phone: "",
    fcmToken: "",
  });
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [fetchAddressMessage, setFetchAddressMessage] = useState("");
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const userResponse = await fetchUsers();
        const mappedUsers = userResponse.data.map((user) => ({
          label: user.name,
          value: user._id,
        }));
        setItems(mappedUsers);
      } catch (error) {
        Alert.alert("Error", "Failed to load user list.");
      }
    };
    loadUsers();
  }, []);

  const handleFetchAddress = async () => {
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (isNaN(lat) || isNaN(lng)) {
      setFetchAddressMessage("Please enter valid latitude and longitude.");
      return;
    }

    setIsFetchingAddress(true);
    setFetchAddressMessage("Fetching address...");
    try {
      const geocodeResult = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });
      if (geocodeResult && geocodeResult.length > 0) {
        const address = geocodeResult[0];
        const formattedAddress = `${address.street}, ${address.city}, ${address.region}, ${address.country}`;
        setFormData((prev) => ({ ...prev, address: formattedAddress }));
        setFetchAddressMessage("Address found!");
      } else {
        setFormData((prev) => ({ ...prev, address: "Address not found." }));
        setFetchAddressMessage("Address not found. Please try again.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setFetchAddressMessage("Error fetching address. Please try again.");
    } finally {
      setIsFetchingAddress(false);
    }
  };

  const handleFetchCurrentLocation = async () => {
    setIsFetchingLocation(true);
    setFetchAddressMessage("Requesting location permissions...");
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setFetchAddressMessage("Permission to access location was denied");
      setIsFetchingLocation(false);
      return;
    }
    try {
      setFetchAddressMessage("Fetching current location...");
      let location = await Location.getCurrentPositionAsync({});
      setFormData((prev) => ({
        ...prev,
        latitude: location.coords.latitude.toString(),
        longitude: location.coords.longitude.toString(),
      }));
      setFetchAddressMessage("Current location fetched!");
    } catch (error) {
      console.error("Geolocation error:", error);
      setFetchAddressMessage(
        "Failed to fetch location. Please check settings."
      );
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleSave = async () => {
    if (!value) {
      Alert.alert("Error", "Please select a user.");
      return;
    }
    setLoading(true);
    try {
      const garageData = {
        userId: value,
        ...formData,
        services: formData.services
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      };
      await addGarage(garageData);
      Alert.alert("Success", "Garage added successfully!");
      navigation.goBack();
    } catch (error) {
      console.error(
        "Failed to add garage:",
        error.response?.data || error.message
      );
      Alert.alert("Error", "Failed to add garage.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <DropDownPicker
              open={open}
              value={value}
              items={items}
              setOpen={setOpen}
              setValue={setValue}
              setItems={setItems}
              placeholder="Select User"
              style={styles.dropdown}
              listMode="SCROLLVIEW"
              placeholderStyle={{ color: "#000000" }}
              labelStyle={{ color: "#000000" }}
              dropDownContainerStyle={{
                backgroundColor: "#FFFFFF",
                borderColor: "#000000",
              }}
              zIndex={1000}
            />
            <TextInput
              label="Garage Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              mode="outlined"
              style={styles.modalInput}
            />
            <TextInput
              label="Description"
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              mode="outlined"
              style={styles.modalInput}
              multiline
            />
            <TextInput
              label="Services (comma-separated)"
              value={formData.services}
              onChangeText={(text) =>
                setFormData({ ...formData, services: text })
              }
              mode="outlined"
              style={styles.modalInput}
            />
            <View style={styles.locationContainer}>
              <TextInput
                label="Latitude"
                value={formData.latitude}
                onChangeText={(text) =>
                  setFormData({ ...formData, latitude: text })
                }
                mode="outlined"
                style={[styles.modalInput, styles.halfInput]}
                keyboardType="numeric"
              />
              <TextInput
                label="Longitude"
                value={formData.longitude}
                onChangeText={(text) =>
                  setFormData({ ...formData, longitude: text })
                }
                mode="outlined"
                style={[styles.modalInput, styles.halfInput]}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.buttonRow}>
              <Button
                mode="contained"
                onPress={handleFetchCurrentLocation}
                loading={isFetchingLocation}
                style={[styles.fetchButton, styles.buttonLeft]}
                icon="crosshairs-gps"
                buttonColor="#4CAF50"
                textColor="#FFFFFF"
                disabled={isFetchingAddress}
              >
                Use GPS
              </Button>
              <Button
                mode="contained"
                onPress={handleFetchAddress}
                loading={isFetchingAddress}
                style={[styles.fetchButton, styles.buttonRight]}
                icon="map-search"
                buttonColor="#4CAF50"
                textColor="#FFFFFF"
                disabled={isFetchingLocation}
              >
                Fetch Address
              </Button>
            </View>
            {fetchAddressMessage ? (
              <Text style={styles.fetchMessage}>{fetchAddressMessage}</Text>
            ) : null}
            <TextInput
              label="Address"
              value={formData.address}
              onChangeText={(text) =>
                setFormData({ ...formData, address: text })
              }
              mode="outlined"
              style={styles.modalInput}
            />
            <TextInput
              label="Phone"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              mode="outlined"
              style={styles.modalInput}
            />
            <TextInput
              label="FCM Token"
              value={formData.fcmToken}
              onChangeText={(text) =>
                setFormData({ ...formData, fcmToken: text })
              }
              mode="outlined"
              style={styles.modalInput}
            />
          </Card.Content>
        </Card>
      </ScrollView>
      <View style={styles.bottomActions}>
        <Button
          onPress={() => navigation.goBack()}
          mode="outlined"
          textColor="#000000"
        >
          Cancel
        </Button>
        <Button
          onPress={handleSave}
          mode="contained"
          loading={loading}
          buttonColor="#4CAF50"
          textColor="#FFFFFF"
        >
          Save
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  appBar: {
    backgroundColor: "#4CAF50",
  },
  appBarTitle: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    elevation: 0,
    backgroundColor: "transparent",
  },
  modalInput: {
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  fetchButton: {
    flex: 1,
  },
  buttonLeft: {
    marginRight: 6,
  },
  buttonRight: {
    marginLeft: 6,
  },
  fetchMessage: {
    textAlign: "center",
    marginBottom: 12,
    color: "#000000",
  },
  bottomActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#000000",
    backgroundColor: "#FFFFFF",
  },
  dropdown: {
    marginBottom: 12,
    borderColor: "#000000",
  },
});

export default AddGarageScreen;
