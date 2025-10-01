import React, { useState } from "react";
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
  Button,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

// Define Brand Color
const PRIMARY_COLOR = "#4CAF50";

// --- MOCK DATA ---
// Replace this with a hook (e.g., useGarageUsers) to fetch real data
const MOCK_USERS = [
  {
    id: "u1",
    name: "Alice Johnson",
    email: "alice@garageco.com",
    role: "garageOwner",
  },
  { id: "u2", name: "Bob Smith", email: "bob@garageco.com", role: "user" },
  {
    id: "u3",
    name: "Charlie Brown",
    email: "charlie@garageco.com",
    role: "user",
  },
  { id: "u4", name: "Diana Prince", email: "diana@garageco.com", role: "user" },
];
// --- END MOCK DATA ---

const UserManagementScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [users, setUsers] = useState(MOCK_USERS); // State to hold user list

  // Navigate to the screen for adding a new user
  const navigateToAddUser = () => {
    // In a real app, you would navigate to your AddUserFormScreen
    Alert.alert(
      "Add User",
      "Navigation to AddUserScreen is pending implementation."
    );
    // navigation.navigate('AddUserScreen');
  };

  // Logic to simulate user deletion
  const handleDelete = (userId, userName) => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to remove ${userName}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            // Replace with actual service call: await deleteUserFromGarage(userId);
            setUsers(users.filter((user) => user.id !== userId));
            // Show a toast or notification of success
          },
        },
      ]
    );
  };

  const renderUserItem = (user) => (
    <View key={user.id}>
      <List.Item
        title={user.name}
        description={user.email}
        left={() => (
          <Avatar.Text
            size={40}
            label={user.name.charAt(0)}
            style={{ backgroundColor: colors.surfaceVariant }}
            color={PRIMARY_COLOR}
          />
        )}
        right={() => (
          <View style={styles.rightContainer}>
            {/* Display Role */}
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
                {user.role}
              </Text>
            </View>

            {/* Delete Button */}
            <TouchableOpacity
              onPress={() => handleDelete(user.id, user.name)}
              style={styles.deleteButton}
              accessibilityLabel={`Remove ${user.name}`}
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
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

      {/* Floating Action Button for Adding New User */}
      <FAB
        icon="plus"
        label="Add User"
        style={[styles.fab, { backgroundColor: PRIMARY_COLOR }]}
        onPress={navigateToAddUser}
        color="#FFFFFF"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for the FAB
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontWeight: "bold",
    marginBottom: 5,
    color: PRIMARY_COLOR,
  },
  listSection: {
    marginVertical: 0,
    paddingHorizontal: 10,
  },
  listItem: {
    paddingVertical: 5,
  },
  divider: {
    marginHorizontal: 15,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  roleBadge: {
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 10,
    minWidth: 80,
    alignItems: "center",
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
  },
  deleteButton: {
    padding: 8,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    marginTop: 50,
  },
});

export default UserManagementScreen;
