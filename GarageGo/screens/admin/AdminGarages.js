import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  Text,
  Button as RNButton,
} from "react-native";
import {
  Appbar,
  Card,
  Button,
  TextInput,
  ActivityIndicator,
  List,
  FAB,
} from "react-native-paper";
import { getGarages, deleteGarage } from "../../services/garageService";

const AdminGarages = ({ navigation, onRefresh }) => {
  const [garages, setGarages] = useState([]);
  const [filteredGarages, setFilteredGarages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchGarages();
  }, [onRefresh]);

  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = garages.filter(
      (garage) =>
        garage.name.toLowerCase().includes(lowerCaseQuery) ||
        (garage.services &&
          garage.services.join(" ").toLowerCase().includes(lowerCaseQuery))
    );
    setFilteredGarages(filtered);
  }, [searchQuery, garages]);

  const fetchGarages = async () => {
    setIsRefreshing(true);
    setLoading(true);
    try {
      const response = await getGarages();
      setGarages(response.data);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch garages.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
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
              await deleteGarage(id);
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

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const renderGarageItem = ({ item, index }) => (
    <Card style={styles.card}>
      <Card.Title
        title={item.name}
        subtitle={item.description}
        titleStyle={styles.cardTitle}
        subtitleStyle={styles.cardSubtitle}
        right={() => (
          <View style={styles.cardActions}>
            <Button
              icon="pencil"
              onPress={() =>
                navigation.navigate("EditGarage", { garage: item })
              }
              mode="text"
              textColor="#000000"
            />
            <Button
              icon="delete"
              onPress={() => handleDelete(item._id)}
              mode="text"
              textColor="#000000"
            />
            <Button
              icon={expandedIndex === index ? "chevron-up" : "chevron-down"}
              onPress={() => toggleExpand(index)}
              mode="text"
              textColor="#000000"
            />
          </View>
        )}
      />
      {expandedIndex === index && (
        <Card.Content style={styles.cardContent}>
          <List.Item
            title="Services"
            description={item.services.join(", ")}
            left={(props) => <List.Icon {...props} icon="tools" />}
            style={styles.listItem}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
          />
          <List.Item
            title="Address"
            description={item.address}
            left={(props) => <List.Icon {...props} icon="map-marker" />}
            style={styles.listItem}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
          />
          <List.Item
            title="Phone"
            description={item.phone}
            left={(props) => <List.Icon {...props} icon="phone" />}
            style={styles.listItem}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
          />
          <List.Item
            title="Location"
            description={`Latitude: ${item.latitude}, Longitude: ${item.longitude}`}
            left={(props) => <List.Icon {...props} icon="compass" />}
            style={styles.listItem}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
          />
        </Card.Content>
      )}
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          label="Search garages..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          mode="outlined"
          left={<TextInput.Icon icon="magnify" />}
        />
      </View>

      {loading ? (
        <ActivityIndicator
          animating={true}
          color="#4CAF50"
          style={styles.loadingIndicator}
          size="large"
        />
      ) : (
        <FlatList
          data={filteredGarages}
          renderItem={renderGarageItem}
          keyExtractor={(item, index) => item._id || index.toString()}
          contentContainerStyle={styles.listContainer}
          onRefresh={fetchGarages}
          refreshing={isRefreshing}
        />
      )}

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate("AddGarage")}
        color="#FFFFFF"
        backgroundColor="#4CAF50"
      />
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
  listContainer: {
    padding: 12,
  },
  card: {
    marginVertical: 6,
    borderRadius: 10,
    elevation: 3,
    backgroundColor: "#FFFFFF",
  },
  cardTitle: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  cardSubtitle: {
    color: "#000000",
  },
  cardContent: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingRight: 12,
    alignItems: "center",
  },
  actionButtonIcon: {
    fontSize: 20,
  },
  searchContainer: {
    padding: 12,
    backgroundColor: "#FFFFFF",
    elevation: 1,
  },
  searchInput: {
    backgroundColor: "#FFFFFF",
    borderColor: "#000000",
  },
  loadingIndicator: {
    marginTop: 50,
  },
  fab: {
    position: "absolute",
    margin: 20,
    right: 0,
    bottom: 0,
    backgroundColor: "#4CAF50",
    color: "#FFFFFF",
  },
  listItem: {
    paddingVertical: 2,
    minHeight: 35,
  },
  listItemTitle: {
    fontWeight: "bold",
    color: "#000000",
  },
  listItemDescription: {
    color: "#000000",
  },
});

export default AdminGarages;
