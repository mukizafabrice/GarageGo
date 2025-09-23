import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  Text,
  Pressable,
} from "react-native";
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
import { updateGarage } from "../../services/garageService";
import { fetchUsers } from "../../services/AuthService";

const EditGarageScreen = ({ navigation, route }) => {
  const { garage } = route.params;

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
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const userResponse = await fetchUsers();
        const mappedUsers = userResponse.data.map((user) => ({
          id: user._id,
          name: user.name,
        }));
        setUsers(mappedUsers);
        if (garage) {
          const userForEdit = mappedUsers.find(
            (u) => u.id === garage.userId._id
          );
          if (userForEdit) {
            setSelectedUser(userForEdit);
          }
        }
      } catch (error) {
        Alert.alert("Error", "Failed to load user list.");
      }
    };
    loadUsers();

    if (garage) {
      setFormData({
        name: garage.name,
        description: garage.description,
        services: garage.services.join(", "),
        latitude: garage.latitude.toString(),
        longitude: garage.longitude.toString(),
        address: garage.address,
        phone: garage.phone,
        fcmToken: garage.fcmToken || "",
      });
    }
  }, [garage]);

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

  const handleUpdate = async () => {
    if (!selectedUser) {
      Alert.alert("Error", "Please select a user.");
      return;
    }
    setLoading(true);
    try {
      const garageData = {
        userId: selectedUser.id,
        ...formData,
        services: formData.services
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      };
      await updateGarage(garage._id, garageData);
      Alert.alert("Success", "Garage updated successfully!");
      navigation.goBack();
    } catch (error) {
      console.error(
        "Failed to update garage:",
        error.response?.data || error.message
      );
      Alert.alert("Error", "Failed to update garage.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Pressable
              onPress={() => setUserModalVisible(true)}
              style={{ marginBottom: 12 }}
            >
              <TextInput
                label="User"
                value={selectedUser ? selectedUser.name : ""}
                placeholder="Select User"
                editable={false}
                mode="outlined"
                style={styles.input}
                right={<TextInput.Icon icon="menu-down" />}
              />
            </Pressable>
            <TextInput
              label="Garage Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Description"
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              mode="outlined"
              style={styles.input}
              multiline
            />
            <TextInput
              label="Services (comma-separated)"
              value={formData.services}
              onChangeText={(text) =>
                setFormData({ ...formData, services: text })
              }
              mode="outlined"
              style={styles.input}
            />
            <View style={styles.locationContainer}>
              <TextInput
                label="Latitude"
                value={formData.latitude}
                onChangeText={(text) =>
                  setFormData({ ...formData, latitude: text })
                }
                mode="outlined"
                style={[styles.input, styles.halfInput]}
                keyboardType="numeric"
              />
              <TextInput
                label="Longitude"
                value={formData.longitude}
                onChangeText={(text) =>
                  setFormData({ ...formData, longitude: text })
                }
                mode="outlined"
                style={[styles.input, styles.halfInput]}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.buttonRow}>
              <Button
                mode="contained"
                onPress={handleFetchCurrentLocation}
                loading={isFetchingLocation}
                style={[styles.fetchButton, styles.buttonLeft]}
                buttonColor="#4CAF50"
                textColor="#FFFFFF"
                icon="crosshairs-gps"
                disabled={isFetchingAddress}
              >
                Use GPS
              </Button>
              <Button
                mode="contained"
                onPress={handleFetchAddress}
                loading={isFetchingAddress}
                style={[styles.fetchButton, styles.buttonRight]}
                buttonColor="#4CAF50"
                textColor="#FFFFFF"
                icon="map-search"
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
              style={styles.input}
            />
            <TextInput
              label="Phone"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="FCM Token"
              value={formData.fcmToken}
              onChangeText={(text) =>
                setFormData({ ...formData, fcmToken: text })
              }
              mode="outlined"
              style={styles.input}
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
          onPress={handleUpdate}
          mode="contained"
          loading={loading}
          buttonColor="#4CAF50"
          textColor="#FFFFFF"
        >
          Update
        </Button>
      </View>

      <Modal
        visible={userModalVisible}
        onDismiss={() => setUserModalVisible(false)}
        contentContainerStyle={styles.userModalContainer}
      >
        <View style={styles.userModalContent}>
          <Text style={styles.userModalTitle}>Select User</Text>
          <Divider />
          <ScrollView>
            <List.Section>
              {users.map((item) => (
                <View key={item.id}>
                  <List.Item
                    title={item.name}
                    onPress={() => {
                      setSelectedUser(item);
                      setUserModalVisible(false);
                    }}
                    style={
                      selectedUser && selectedUser.id === item.id
                        ? styles.selectedUserItem
                        : null
                    }
                    titleStyle={{ color: "#000000" }}
                  />
                  <Divider />
                </View>
              ))}
            </List.Section>
          </ScrollView>
        </View>
      </Modal>
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
  input: {
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
  userModalContainer: {
    backgroundColor: "white",
    padding: 20,
    marginHorizontal: 40,
    borderRadius: 10,
    maxHeight: "80%",
  },
  userModalContent: {
    flex: 1,
  },
  userModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#000000",
  },
  selectedUserItem: {
    backgroundColor: "#E6F4EA",
  },
});

export default EditGarageScreen;
