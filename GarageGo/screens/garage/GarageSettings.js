import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

// =============================================
// Mock API Service
// In a real app, you would separate this into its own file
// and connect to a real backend.
// =============================================
let garagesData = [
  {
    id: "1",
    name: "Auto Repair Hub",
    description: "Full-service car repair and maintenance.",
    services: ["Oil Change", "Brakes", "Engine Diagnostics"],
    latitude: 40.7128,
    longitude: -74.006,
    address: "123 Main St, Anytown, USA",
    phone: "555-123-4567",
    userId: "user123",
    fcmToken: "mock-fcm-token-1",
  },
  {
    id: "2",
    name: "Elite Performance",
    description: "Specializing in high-performance vehicle tuning.",
    services: ["Engine Tuning", "Suspension", "Exhaust"],
    latitude: 34.0522,
    longitude: -118.2437,
    address: "456 Performance Ave, Los Angeles, USA",
    phone: "555-987-6543",
    userId: "user124",
    fcmToken: "mock-fcm-token-2",
  },
  {
    id: "3",
    name: "Green Valley Auto",
    description: "Eco-friendly vehicle services.",
    services: ["Hybrid Repair", "EV Charging", "Tire Rotation"],
    latitude: 41.8781,
    longitude: -87.6298,
    address: "789 Green Blvd, Chicago, USA",
    phone: "555-456-7890",
    userId: "user125",
    fcmToken: "mock-fcm-token-3",
  },
];

const mockApi = {
  getGarages: async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { data: garagesData };
  },
  createGarage: async (garageData) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newGarage = {
      ...garageData,
      id: Math.random().toString(36).substring(2, 9),
      userId: "user" + Math.random().toString(36).substring(2, 5),
      fcmToken: "mock-fcm-token-" + Math.random().toString(36).substring(2, 5),
    };
    garagesData.push(newGarage);
    return { data: newGarage };
  },
  updateGarage: async (id, garageData) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = garagesData.findIndex((g) => g.id === id);
    if (index !== -1) {
      garagesData[index] = { ...garagesData[index], ...garageData };
      return { data: garagesData[index] };
    }
    throw new Error("Garage not found");
  },
  deleteGarage: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    garagesData = garagesData.filter((g) => g.id !== id);
    return { data: null };
  },
};

// =============================================
// Garage Management Screen Component
// =============================================
const GarageManagementScreen = () => {
  const [garages, setGarages] = useState([]);
  const [filteredGarages, setFilteredGarages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentGarage, setCurrentGarage] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    services: "",
    latitude: "",
    longitude: "",
    address: "",
    phone: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchGarages();
  }, []);

  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = garages.filter(
      (garage) =>
        garage.name.toLowerCase().includes(lowerCaseQuery) ||
        garage.services.join(" ").toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredGarages(filtered);
  }, [searchQuery, garages]);

  const fetchGarages = async () => {
    setLoading(true);
    try {
      const response = await mockApi.getGarages();
      setGarages(response.data);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch garages.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    try {
      const garageData = {
        ...formData,
        services: formData.services.split(",").map((s) => s.trim()),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      };

      if (currentGarage) {
        // Update an existing garage
        await mockApi.updateGarage(currentGarage.id, garageData);
        Alert.alert("Success", "Garage updated successfully!");
      } else {
        // Create a new garage
        await mockApi.createGarage(garageData);
        Alert.alert("Success", "Garage created successfully!");
      }
      setModalVisible(false);
      fetchGarages();
    } catch (error) {
      Alert.alert("Error", "Failed to save garage.");
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this garage?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await mockApi.deleteGarage(id);
              Alert.alert("Success", "Garage deleted successfully!");
              fetchGarages();
            } catch (error) {
              Alert.alert("Error", "Failed to delete garage.");
            }
          },
        },
      ]
    );
  };

  const openAddModal = () => {
    setCurrentGarage(null);
    setFormData({
      name: "",
      description: "",
      services: "",
      latitude: "",
      longitude: "",
      address: "",
      phone: "",
    });
    setModalVisible(true);
  };

  const openEditModal = (garage) => {
    setCurrentGarage(garage);
    setFormData({
      name: garage.name,
      description: garage.description,
      services: garage.services.join(", "),
      latitude: garage.latitude.toString(),
      longitude: garage.longitude.toString(),
      address: garage.address,
      phone: garage.phone,
    });
    setModalVisible(true);
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderGarageItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => openEditModal(item)}
            style={styles.actionButton}
          >
            <FontAwesome5 name="edit" size={20} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
            style={styles.actionButton}
          >
            <FontAwesome5 name="trash-alt" size={20} color="#E57373" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => toggleExpand(item.id)}
            style={styles.actionButton}
          >
            <FontAwesome5
              name={expandedId === item.id ? "chevron-up" : "chevron-down"}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>
      </View>
      {expandedId === item.id && (
        <View style={styles.expandedContent}>
          <Text style={styles.cardDescription}>{item.description}</Text>
          <Text style={styles.cardServices}>
            Services: {item.services.join(", ")}
          </Text>
          <Text style={styles.cardDetails}>Address: {item.address}</Text>
          <Text style={styles.cardDetails}>Phone: {item.phone}</Text>
          <Text style={styles.cardDetails}>Latitude: {item.latitude}</Text>
          <Text style={styles.cardDetails}>Longitude: {item.longitude}</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Garage Management</Text>
      </View>

      <View style={styles.searchContainer}>
        <FontAwesome5
          name="search"
          size={18}
          color="#999"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search garages..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#4CAF50"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={filteredGarages}
          renderItem={renderGarageItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <FontAwesome5 name="plus" size={24} color="#FFF" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>
              {currentGarage ? "Edit Garage" : "Add New Garage"}
            </Text>
            <ScrollView style={styles.scrollView}>
              <TextInput
                style={styles.input}
                placeholder="Garage Name"
                value={formData.name}
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
                }
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="Description"
                value={formData.description}
                onChangeText={(text) =>
                  setFormData({ ...formData, description: text })
                }
                multiline
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="Services (comma-separated)"
                value={formData.services}
                onChangeText={(text) =>
                  setFormData({ ...formData, services: text })
                }
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="Address"
                value={formData.address}
                onChangeText={(text) =>
                  setFormData({ ...formData, address: text })
                }
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="Phone"
                value={formData.phone}
                onChangeText={(text) =>
                  setFormData({ ...formData, phone: text })
                }
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="Latitude"
                value={formData.latitude}
                onChangeText={(text) =>
                  setFormData({ ...formData, latitude: text })
                }
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="Longitude"
                value={formData.longitude}
                onChangeText={(text) =>
                  setFormData({ ...formData, longitude: text })
                }
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.buttonClose}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.textStyle}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.buttonSave}
                onPress={handleCreateOrUpdate}
              >
                <Text style={styles.textStyle}>
                  {currentGarage ? "Update" : "Create"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// =============================================
// Stylesheet
// =============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F4F7",
  },
  header: {
    padding: 20,
    backgroundColor: "#4CAF50",
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
    flex: 1,
  },
  listContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    paddingRight: 10,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    marginLeft: 15,
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  cardServices: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
  },
  cardDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: "#4CAF50",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  input: {
    width: "100%",
    backgroundColor: "#F0F4F7",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  buttonClose: {
    backgroundColor: "#BDBDBD",
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    flex: 1,
    marginRight: 10,
  },
  buttonSave: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    flex: 1,
    marginLeft: 10,
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 10,
    marginHorizontal: 20,
    marginTop: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  expandedContent: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: 10,
  },
});

export default GarageManagementScreen;
