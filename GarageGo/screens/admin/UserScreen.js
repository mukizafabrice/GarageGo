// screens/admin/UserScreen.js
import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Alert } from "react-native";
import {
  Card,
  Button,
  TextInput,
  ActivityIndicator,
  List,
  FAB,
  Modal,
  Portal,
  Provider,
  Text,
} from "react-native-paper";
import DropDownPicker from "react-native-dropdown-picker";
import {
  fetchUsers,
  deleteUser,
  addUser,
  updateUser,
} from "../../services/AuthService";

const UserScreen = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");

  // DropDownPicker states
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { label: "Admin", value: "admin" },
    { label: "User", value: "user" },
  ]);

  useEffect(() => {
    getUsers();
  }, []);

  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = users.filter((user) =>
      user.name.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const getUsers = async () => {
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
              getUsers();
            } catch (error) {
              Alert.alert("Error", "Failed to delete user.");
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!name || !email) {
      Alert.alert("Validation", "Name and Email are required.");
      return;
    }

    try {
      if (editingUser) {
        await updateUser(editingUser._id, { name, email, role });
        Alert.alert("Success", "User updated successfully!");
      } else {
        await addUser({ name, email }); // role not needed
        Alert.alert("Success", "User added successfully!");
      }
      setModalVisible(false);
      resetForm();
      getUsers();
    } catch (error) {
      Alert.alert("Error", "Failed to save user.");
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setName("");
    setEmail("");
    setRole("user");
  };

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const renderUserItem = ({ item, index }) => (
    <Card style={styles.card}>
      <Card.Title
        title={item.name}
        titleStyle={styles.cardTitle}
        subtitle={item.email}
        subtitleStyle={styles.cardSubtitle}
        right={() => (
          <View style={styles.cardActions}>
            <Button
              icon="pencil"
              onPress={() => {
                setEditingUser(item);
                setName(item.name);
                setEmail(item.email);
                setRole(item.role);
                setModalVisible(true);
              }}
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
            title="Role"
            description={item.role}
            left={(props) => <List.Icon {...props} icon="account" />}
            style={styles.listItem}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
          />
          <List.Item
            title="Password"
            description="******** (default)"
            left={(props) => <List.Icon {...props} icon="lock" />}
            style={styles.listItem}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
          />
        </Card.Content>
      )}
    </Card>
  );

  return (
    <Provider>
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
            onRefresh={getUsers}
            refreshing={isRefreshing}
          />
        )}

        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
          color="#FFFFFF"
        />

        {/* Add/Edit Modal */}
        <Portal>
          <Modal
            visible={modalVisible}
            onDismiss={() => setModalVisible(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <Text style={styles.modalTitle}>
              {editingUser ? "Edit User" : "Add User"}
            </Text>
            <TextInput
              label="Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
            />
            {/* Role dropdown only when editing */}
            {editingUser && (
              <DropDownPicker
                open={open}
                value={role}
                items={items}
                setOpen={setOpen}
                setValue={setRole}
                setItems={setItems}
                containerStyle={{ marginBottom: 12 }}
                placeholder="Select role"
                style={{ borderColor: "#4CAF50" }}
              />
            )}
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.saveButton}
              buttonColor="#4CAF50"
            >
              Save
            </Button>
          </Modal>
        </Portal>
      </View>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  listContainer: { padding: 12 },
  card: {
    marginVertical: 6,
    borderRadius: 10,
    elevation: 3,
    backgroundColor: "#FFFFFF",
  },
  cardTitle: { color: "#4CAF50", fontWeight: "bold" },
  cardSubtitle: { color: "#000000" },
  cardContent: { paddingTop: 0, paddingBottom: 0 },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingRight: 12,
    alignItems: "center",
  },
  searchContainer: { padding: 12, backgroundColor: "#FFFFFF", elevation: 1 },
  searchInput: { backgroundColor: "#FFFFFF" },
  loadingIndicator: { marginTop: 50 },
  fab: {
    position: "absolute",
    margin: 20,
    right: 0,
    bottom: 0,
    backgroundColor: "#4CAF50",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#4CAF50",
  },
  input: { marginBottom: 12 },
  saveButton: { marginTop: 10, borderRadius: 8 },
  listItem: { paddingVertical: 2, minHeight: 35 },
  listItemTitle: { fontWeight: "bold", color: "#000000" },
  listItemDescription: { color: "#000000" },
});

export default UserScreen;
