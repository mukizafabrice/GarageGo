import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Alert, Text } from "react-native";
import {
  Card,
  Button,
  TextInput,
  ActivityIndicator,
  List,
  FAB,
} from "react-native-paper";
import { fetchUsers, deleteUser } from "../../services/AuthService";

const UserScreen = ({ navigation, onRefresh }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, [onRefresh]);

  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = users.filter((user) =>
      user.name.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const fetchUserData = async () => {
    setIsRefreshing(true);
    setLoading(true);
    try {
      const response = await fetchUsers();
      setUsers(response.data);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch users.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this user?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteUser(id);
              Alert.alert("Success", "User deleted successfully!");
              fetchUserData();
            } catch (error) {
              Alert.alert("Error", "Failed to delete user.");
            }
          },
        },
      ]
    );
  };

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const renderUserItem = ({ item, index }) => (
    <Card style={styles.card}>
      <Card.Title
        title={item.name}
        titleStyle={styles.cardTitle}
        subtitleStyle={styles.cardSubtitle}
        right={() => (
          <View style={styles.cardActions}>
            <Button
              icon="pencil"
              onPress={() => navigation.navigate("EditUser", { user: item })}
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
            title="Email"
            description={item.email}
            left={(props) => <List.Icon {...props} icon="mail" />}
            style={styles.listItem}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
          />
          <List.Item
            title="Role"
            description={item.role}
            left={(props) => <List.Icon {...props} icon="account" />}
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
          label="Search users..."
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
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item, index) => item._id || index.toString()}
          contentContainerStyle={styles.listContainer}
          onRefresh={fetchUserData}
          refreshing={isRefreshing}
        />
      )}

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate("AddUser")}
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

export default UserScreen;
