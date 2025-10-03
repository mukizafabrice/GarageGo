import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  List,
  Divider,
  Avatar,
  FAB,
  useTheme,
  Portal,
  Dialog,
  TextInput,
  Button,
} from "react-native-paper";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { getGarageByUserId } from "../../services/garageService";
import {
  deleteUser,
  updateUser,
  registerUserAndAssignGarage,
} from "../../services/AuthService";
import { useAuth } from "../../context/AuthContext";
import { RefreshControl } from "react-native";
const PRIMARY_COLOR = "#4CAF50";

const UserManagementScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [users, setUsers] = useState([]);
  const [garageId, setGarageId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const userId = user?._id;

  // Edit modal state
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  // Add modal state
  const [addDialogVisible, setAddDialogVisible] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const garageResponse = await getGarageByUserId(userId);
        setUsers(garageResponse.data.userId || []);
        setGarageId(garageResponse.data._id);
      } catch (error) {
        Alert.alert(
          "Error",
          "Failed to load garage users. Please try again later."
        );
      }
    };
    fetchUsers();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const garageResponse = await getGarageByUserId(userId);
      setUsers(garageResponse.data.userId || []);
      setGarageId(garageResponse.data._id);
    } catch (error) {
      Alert.alert("Error", "Failed to refresh users.");
    }
    setRefreshing(false);
  };

  // Add User modal open
  const openAddUserModal = () => {
    setAddName("");
    setAddEmail("");
    setAddPassword("");
    setAddDialogVisible(true);
  };

  // Add User handler (calls your backend registerUserAndAssignGarage)
  const handleAddUser = async () => {
    if (!addName || !addEmail) {
      Alert.alert("Validation", "Name and email are required.");
      return;
    }
    if (!garageId) {
      Alert.alert("Error", "Garage ID not found.");
      return;
    }
    try {
      const newUser = await registerUserAndAssignGarage(
        addName,
        addEmail,
        garageId // <-- Use the correct garageId here
      );
      setUsers((prev) => [...prev, newUser]);
      setAddDialogVisible(false);
    } catch (error) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to add user."
      );
    }
  };

  // Edit user handler
  const handleEdit = (user) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditDialogVisible(true);
  };

  // Save edited user
  const handleSaveEdit = async () => {
    try {
      const updated = await updateUser(editingUser._id, {
        name: editName,
        email: editEmail,
      });
      setUsers((prev) =>
        prev.map((u) => (u._id === editingUser._id ? { ...u, ...updated } : u))
      );
      setEditDialogVisible(false);
      setEditingUser(null);
    } catch (error) {
      Alert.alert("Error", "Failed to update user.");
    }
  };

  // Delete user handler
  const handleDelete = (userId, userName) => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to remove ${userName}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteUser(userId);
              setUsers((prev) => prev.filter((user) => user._id !== userId));
            } catch (error) {
              Alert.alert("Error", "Failed to delete user.");
            }
          },
        },
      ]
    );
  };

  const renderUserItem = (user) => (
    <View key={user._id || user.email}>
      <List.Item
        title={user.name || "No Name"}
        description={user.email || "No Email"}
        left={() => (
          <Avatar.Text
            size={40}
            label={
              user.name && typeof user.name === "string" && user.name.length > 0
                ? user.name.charAt(0).toUpperCase()
                : "U"
            }
            style={{ backgroundColor: colors.surfaceVariant }}
            color={PRIMARY_COLOR}
          />
        )}
        right={() => (
          <View style={styles.rightContainer}>
            {/* Role */}
            <View
              style={[
                styles.roleBadge,
                {
                  backgroundColor:
                    user.role === "garageOwner"
                      ? PRIMARY_COLOR
                      : colors.primaryContainer,
                },
              ]}
            >
              <Text
                style={[
                  styles.roleText,
                  {
                    color:
                      user.role === "garageOwner"
                        ? "white"
                        : colors.onPrimaryContainer,
                  },
                ]}
              >
                {user.role || "user"}
              </Text>
            </View>
            {/* Edit Button */}
            <TouchableOpacity
              onPress={() => handleEdit(user)}
              style={styles.editButton}
              accessibilityLabel={`Edit ${user.name || "User"}`}
            >
              <MaterialIcons name="edit" size={20} color={colors.primary} />
            </TouchableOpacity>
            {/* Delete Button */}
            <TouchableOpacity
              onPress={() => handleDelete(user._id, user.name)}
              style={styles.deleteButton}
              accessibilityLabel={`Remove ${user.name || "User"}`}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
        style={styles.listItem}
      />
      <Divider style={styles.divider} />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.headerTitle}>
            Manage Garage Users ({users.length})
          </Text>
          <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
            List of users associated with this garage.
          </Text>
        </View>

        {users.length > 0 ? (
          <List.Section style={styles.listSection}>
            {users.map(renderUserItem)}
          </List.Section>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={60} color={colors.backdrop} />
            <Text
              variant="headlineSmall"
              style={{ marginTop: 10, color: colors.onSurface }}
            >
              No Users Found
            </Text>
            <Text
              style={{
                color: colors.onSurfaceVariant,
                textAlign: "center",
                marginTop: 5,
              }}
            >
              Tap the '+' button to add new garage personnel.
            </Text>
          </View>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        label="Add User"
        style={[styles.fab, { backgroundColor: PRIMARY_COLOR }]}
        onPress={openAddUserModal}
        color="#FFFFFF"
      />

      {/* Edit Dialog */}
      <Portal>
        <Dialog
          visible={editDialogVisible}
          onDismiss={() => setEditDialogVisible(false)}
        >
          <Dialog.Title>Edit User</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Name"
              value={editName}
              onChangeText={setEditName}
              style={{ marginBottom: 10 }}
            />
            <TextInput
              label="Email"
              value={editEmail}
              onChangeText={setEditEmail}
              style={{ marginBottom: 10 }}
              autoCapitalize="none"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleSaveEdit}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Add Dialog */}
      <Portal>
        <Dialog
          visible={addDialogVisible}
          onDismiss={() => setAddDialogVisible(false)}
        >
          <Dialog.Title>Add User</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Name"
              value={addName}
              onChangeText={setAddName}
              style={{ marginBottom: 10 }}
            />
            <TextInput
              label="Email"
              value={addEmail}
              onChangeText={setAddEmail}
              style={{ marginBottom: 10 }}
              autoCapitalize="none"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAddDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleAddUser}>Add</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  header: { padding: 20, paddingBottom: 10 },
  headerTitle: { fontWeight: "bold", marginBottom: 5, color: PRIMARY_COLOR },
  listSection: { marginVertical: 0, paddingHorizontal: 10 },
  listItem: { paddingVertical: 5 },
  divider: { marginHorizontal: 15 },
  rightContainer: { flexDirection: "row", alignItems: "center" },
  roleBadge: {
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 10,
    minWidth: 80,
    alignItems: "center",
  },
  roleText: { fontSize: 12, fontWeight: "600" },
  editButton: { padding: 8, marginRight: 2 },
  deleteButton: { padding: 8 },
  fab: { position: "absolute", margin: 16, right: 0, bottom: 0 },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    marginTop: 50,
  },
});

export default UserManagementScreen;
