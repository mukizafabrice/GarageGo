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

const PRIMARY_COLOR = "#4CAF50";

const UserScreen = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- Filtering States ---
  const [filterRole, setFilterRole] = useState("all"); // 'all' by default
  const [filterOpen, setFilterOpen] = useState(false);

  // UPDATED: Added 'garageOwner' to filter options
  const filterOptions = [
    { label: "All Roles", value: "all" },
    { label: "Admin", value: "admin" },
    { label: "User", value: "user" },
    { label: "Garage Owner", value: "garageOwner" },
  ];

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");

  // DropDownPicker states for MODAL
  const [open, setOpen] = useState(false);

  // UPDATED: Added 'garageOwner' to modal dropdown items
  const [items, setItems] = useState([
    { label: "Admin", value: "admin" },
    { label: "User", value: "user" },
    { label: "Garage Owner", value: "garageOwner" },
  ]);

  useEffect(() => {
    getUsers();
  }, []);

  // UPDATED FILTERING LOGIC
  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(lowerCaseQuery) ||
        user.email.toLowerCase().includes(lowerCaseQuery);

      // Filter by role: 'all' matches everything, otherwise check for exact match
      const matchesRole = filterRole === "all" || user.role === filterRole;

      return matchesSearch && matchesRole;
    });
    setFilteredUsers(filtered);
  }, [searchQuery, users, filterRole]); // Added filterRole dependency

  const getUsers = async () => {
    setIsRefreshing(true);
    setLoading(true);
    try {
      const response = await fetchUsers();
      // Ensure data is sorted by name for better consistency
      const sortedUsers = response.data.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      setUsers(sortedUsers);
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
        // Ensure role is sent when editing
        await updateUser(editingUser._id, { name, email, role });
        Alert.alert("Success", "User updated successfully!");
      } else {
        // Assume backend defaults role when adding a new user if not explicitly sent
        await addUser({ name, email });
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
              textColor={PRIMARY_COLOR}
            />
            <Button
              icon="delete"
              onPress={() => handleDelete(item._id)}
              mode="text"
              textColor="red" // Use red for destructive action
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
            label="Search by name or email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            mode="outlined"
            left={<TextInput.Icon icon="magnify" />}
            activeOutlineColor={PRIMARY_COLOR}
          />

          {/* --- New Role Filter Dropdown --- */}
          {/* zIndex is crucial for the dropdown to render above the FlatList content */}
          <View style={styles.filterWrapper}>
            <Text style={styles.filterLabel}>Filter by Role:</Text>
            <DropDownPicker
              open={filterOpen}
              value={filterRole}
              items={filterOptions}
              setOpen={setFilterOpen}
              setValue={setFilterRole}
              // We must set the list open state back to false when another dropdown opens
              onOpen={() => setOpen(false)}
              setItems={() => {}}
              containerStyle={styles.filterDropdownContainer}
              placeholder="Filter by Role"
              style={{ borderColor: PRIMARY_COLOR }}
              zIndex={3000}
            />
          </View>
          {/* --- End Role Filter Dropdown --- */}
        </View>

        {loading ? (
          <ActivityIndicator
            animating={true}
            color={PRIMARY_COLOR}
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
              activeOutlineColor={PRIMARY_COLOR}
            />
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              activeOutlineColor={PRIMARY_COLOR}
            />
            {/* Role dropdown only when editing */}
            {editingUser && (
              <DropDownPicker
                open={open}
                value={role}
                items={items} // Uses the updated items list
                setOpen={setOpen}
                setValue={setRole}
                // We must set the filter open state back to false when this dropdown opens
                onOpen={() => setFilterOpen(false)}
                setItems={setItems}
                containerStyle={{ marginBottom: 12, zIndex: 1000 }} // Modal zIndex
                placeholder="Select role"
                style={{ borderColor: PRIMARY_COLOR }}
              />
            )}
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.saveButton}
              buttonColor={PRIMARY_COLOR}
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
  cardTitle: { color: PRIMARY_COLOR, fontWeight: "bold" },
  cardSubtitle: { color: "#000000" },
  cardContent: { paddingTop: 0, paddingBottom: 0 },
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
    // Set a high ZIndex on the container to ensure dropdowns work
    zIndex: 2000,
  },
  searchInput: { backgroundColor: "#FFFFFF" },
  // New styles for the filter
  filterWrapper: {
    marginTop: 15,
    zIndex: 1000, // Explicit zIndex for dropdown functionality
  },
  filterLabel: {
    marginBottom: 8,
    fontSize: 14,
    color: "#555",
    fontWeight: "600",
  },
  filterDropdownContainer: {
    height: 50,
    marginBottom: 5,
  },
  // End new styles
  loadingIndicator: { marginTop: 50 },
  fab: {
    position: "absolute",
    margin: 20,
    right: 0,
    bottom: 0,
    backgroundColor: PRIMARY_COLOR,
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 10,
    zIndex: 4000, // Highest zIndex for the modal background
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: PRIMARY_COLOR,
  },
  input: { marginBottom: 12 },
  saveButton: { marginTop: 15, borderRadius: 8 },
  listItem: { paddingVertical: 2, minHeight: 35 },
  listItemTitle: { fontWeight: "bold", color: "#000000" },
  listItemDescription: { color: "#555" },
});

export default UserScreen;
