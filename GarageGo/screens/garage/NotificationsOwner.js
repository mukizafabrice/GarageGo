import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert, // <-- CORRECTED: Imported Alert from 'react-native'
} from "react-native";
import {
  Text,
  Avatar,
  useTheme,
  ActivityIndicator,
  Button,
  Card,
  Chip,
  // Alert was removed from react-native-paper import
} from "react-native-paper";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
// UPDATED: Assuming these are implemented and return Promises for CRUD operations
import {
  getNotificationsByGarageId,
  deleteNotification, // Added for single item delete
  deleteNotificationsByGarageId, // Added for bulk delete
} from "../../services/notificationService";
import { getGarageByUserId } from "../../services/garageService";
import { useAuth } from "../../context/AuthContext";

const PRIMARY_COLOR = "#4CAF50";

// Helper for status color
const statusColor = (status, colors) => {
  // Define explicit color constants for clarity
  const WARNING_ORANGE = "#FFA000";
  const ERROR_RED = colors.error;
  const NEUTRAL_GREY = "#BDBDBD";
  const SUCCESS_GREEN = PRIMARY_COLOR; // Assuming PRIMARY_COLOR is your success color

  switch (status) {
    // ----------------------------------------------------
    // --- Initial Sending Outcome Statuses ---
    // ----------------------------------------------------
    case "SENT_SUCCESS":
    case "SENT_RECEIVED":
      // Request sent or received, waiting for garage response
      return WARNING_ORANGE;

    case "NO_GARAGE_FOUND":
    case "SEND_FAILED":
    case "DRIVER_DATA_ERROR":
      // Definitive failure states for the request
      return ERROR_RED;

    case "INVALID_TOKEN":
      // A technical warning, often treated as an error by the driver
      return WARNING_ORANGE;

    case "SERVER_ERROR":
      // Unknown technical issue
      return NEUTRAL_GREY;

    // ----------------------------------------------------
    // --- Service & Response Statuses (Actionable by Garage) ---
    // ----------------------------------------------------
    case "GARAGE_ACCEPTED":
      // Success state: A garage is coming
      return SUCCESS_GREEN;

    case "GARAGE_DECLINED":
    case "DRIVER_CANCELED":
    case "EXPIRED":
      // Terminal failure states for the service attempt
      return ERROR_RED;

    case "SERVICE_COMPLETED":
      // Final, successful resolution state
      // FIX: Changed from NEUTRAL_GREY to SUCCESS_GREEN (PRIMARY_COLOR)
      return SUCCESS_GREEN;

    default:
      // Fallback for unknown status
      return colors.backdrop;
  }
};

const NotificationCard = ({ notif, onClear, colors, PRIMARY_COLOR }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Function to format coordinates cleanly
  const formatCoordinates = (coords) => {
    if (!coords || coords.length < 2) return "N/A";
    const [lat, lng] = coords;
    return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
  };

  const statusBackground = statusColor(notif.notificationStatus, colors);

  // --- Defensive function to render the Garage ID/Name ---
  const renderAssignedGarage = () => {
    const garage = notif.nearestGarage?.garageId;
    if (!garage) {
      return "Not Assigned";
    }

    // Case 1: Populated object (has properties like name or _id)
    if (typeof garage === "object" && garage !== null) {
      // Use name first, then _id as fallback
      return garage.name || garage._id || "Assigned (Details missing)";
    }

    // Case 2: Non-populated string ID, or an unexpected object converted to string
    return String(garage);
  };
  // ------------------------------------------------------------------------

  return (
    <Card key={notif._id} style={styles.card}>
      <Card.Title
        title={notif.driverName || "Unknown Driver"}
        // Use String() defensively
        subtitle={String(notif.driverPhoneNumber || "N/A")}
        titleStyle={styles.titleStyle}
        left={(props) => (
          <Avatar.Icon
            {...props}
            icon="car-hatchback"
            style={{ backgroundColor: colors.surfaceVariant }}
            color={PRIMARY_COLOR}
          />
        )}
        right={(props) => (
          <View style={styles.titleRightContainer}>
            {/* Status Chip */}
            <Chip
              style={{
                backgroundColor: statusBackground,
                marginRight: 8,
              }}
              textStyle={styles.statusChipText}
            >
              {notif.notificationStatus.replace(/_/g, " ")}
            </Chip>

            {/* Toggle Icon Button */}
            <Button
              icon={isExpanded ? "chevron-up" : "chevron-down"}
              mode="text"
              onPress={() => setIsExpanded(!isExpanded)}
              compact
              contentStyle={styles.toggleButtonContent}
              labelStyle={{ fontSize: 24, margin: 0, padding: 0 }}
              textColor={PRIMARY_COLOR}
            />
          </View>
        )}
      />

      {isExpanded && (
        <Card.Content style={styles.expandedContent}>
          <Text variant="titleSmall" style={styles.detailHeader}>
            Request Details
          </Text>

          {/* Location */}
          <View style={styles.detailRow}>
            <MaterialCommunityIcons
              name="map-marker"
              size={18}
              color={PRIMARY_COLOR}
              style={styles.detailIcon}
            />
            <Text style={styles.detailText}>
              Location: {formatCoordinates(notif.driverLocation?.coordinates)}
            </Text>
          </View>

          {/* Garage ID */}
          <View style={styles.detailRow}>
            <MaterialCommunityIcons
              name="garage"
              size={18}
              color={PRIMARY_COLOR}
              style={styles.detailIcon}
            />

            <Text style={styles.detailText}>
              Assigned Garage: {renderAssignedGarage()}
            </Text>
          </View>

          {/* Expo Ticket (Only if exists) */}
          {notif.expoTicket && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons
                name="ticket-confirmation"
                size={18}
                color={PRIMARY_COLOR}
                style={styles.detailIcon}
              />
              <Text style={styles.detailText} numberOfLines={1}>
                {/* Use String() defensively */}
                Ticket ID: {String(notif.expoTicket)}
              </Text>
            </View>
          )}

          {/* Timestamp */}
          <View style={styles.detailRow}>
            <MaterialCommunityIcons
              name="calendar-clock"
              size={18}
              color={colors.onSurfaceVariant}
              style={styles.detailIcon}
            />
            <Text
              style={{ ...styles.detailText, color: colors.onSurfaceVariant }}
            >
              Sent At: {new Date(notif.createdAt).toLocaleString()}
            </Text>
          </View>

          {/* Action to Clear inside the expanded view */}
          <View style={styles.expandedActions}>
            <Button
              icon="trash-can"
              mode="contained"
              onPress={() => onClear(notif._id)}
              buttonColor={colors.error}
              labelStyle={{ color: "#fff" }}
            >
              Clear Notification
            </Button>
          </View>
        </Card.Content>
      )}
    </Card>
  );
};

// --- NotificationsManager Component ---
const NotificationsManager = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const userId = user?._id;

  const [notifications, setNotifications] = useState([]);
  const [garageId, setGarageId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // --- Core Data Fetching Function (Memoized) ---
  const fetchNotifications = useCallback(async (id) => {
    if (!id) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const notifResponse = await getNotificationsByGarageId(id);
      const sortedNotifications = (notifResponse.data || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setNotifications(sortedNotifications);
      setError(null);
    } catch (e) {
      console.error("Fetch Notifications Error:", e);
      Alert.alert(
        "Error",
        "Failed to load notifications. Please try again later."
      );
      setError("Failed to load notifications.");
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // --- Initial/Garage ID Fetch Effect ---
  useEffect(() => {
    const fetchGarageIdAndNotifications = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const garageResponse = await getGarageByUserId(userId);
        const id = garageResponse.data?._id;
        setGarageId(id);

        if (id) {
          await fetchNotifications(id);
        } else {
          setNotifications([]);
          setLoading(false);
        }
      } catch (e) {
        console.error("Fetch Garage ID Error:", e);
        Alert.alert("Error", "Failed to find garage for user.");
        setError("Failed to find garage for user.");
        setLoading(false);
      }
    };

    fetchGarageIdAndNotifications();
  }, [userId, fetchNotifications]);

  // --- Refresh Logic ---
  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(garageId);
  };

  // UPDATED: Function to clear a single notification (client-side and API)
  const handleClear = (id) => {
    Alert.alert(
      "Confirm Deletion", // Title
      "Are you sure you want to clear this notification?", // Message
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => console.log("Deletion cancelled"), // Optional: log action
        },
        {
          text: "Clear", // Destructive option
          style: "destructive",
          onPress: async () => {
            try {
              // API call to persist the delete action
              await deleteNotification(id);

              // Update state on success
              setNotifications((prev) =>
                prev.filter((notif) => notif._id !== id)
              );
              Alert.alert("Success", "Notification cleared successfully.");
            } catch (e) {
              console.error("Delete Notification Error:", e);
              Alert.alert(
                "Error",
                "Failed to clear notification. Please try again."
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // UPDATED: Function to clear ALL notifications (client-side and API)
  const handleClearAllNotifications = async () => {
    if (!garageId) {
      Alert.alert(
        "Error",
        "Cannot clear all notifications: Garage ID not found."
      );
      return;
    }

    setLoading(true); // Show loading overlay while deleting

    try {
      // API call to persist the delete ALL action
      await deleteNotificationsByGarageId(garageId);

      // Update state on success
      setNotifications([]);
      Alert.alert("Success", "All notifications cleared successfully.");
    } catch (e) {
      console.error("Clear All Notifications Error:", e);
      Alert.alert(
        "Error",
        "Failed to clear all notifications. Please try again."
      );
    } finally {
      setLoading(false); // Hide loading overlay
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Driver Service Requests
          </Text>
          {/* Clear All Notifications Button */}
          {notifications.length > 0 && (
            <Button
              mode="text"
              onPress={handleClearAllNotifications}
              icon="trash-can-outline"
              textColor={colors.error}
              compact
            >
              Clear All
            </Button>
          )}
        </View>
        <Text
          variant="bodyMedium"
          style={{ color: colors.onSurfaceVariant, marginBottom: 10 }}
        >
          Tap the **chevron icon** on a request to view detailed information.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator
          animating={true}
          color={PRIMARY_COLOR}
          size="large"
          style={{ marginTop: 40 }}
        />
      ) : notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="notifications-off-outline"
            size={60}
            color={colors.backdrop}
          />
          <Text
            variant="headlineSmall"
            style={{ marginTop: 10, color: colors.onSurface }}
          >
            {error ? "Error Loading Requests" : "No Driver Requests Found"}
          </Text>
          <Text
            style={{
              color: colors.onSurfaceVariant,
              textAlign: "center",
              marginTop: 5,
            }}
          >
            {error
              ? `An error occurred: ${error}`
              : "All active requests and notifications will appear here for management."}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[PRIMARY_COLOR]}
            />
          }
        >
          {notifications.map((notif) => (
            <NotificationCard
              key={notif._id}
              notif={notif}
              onClear={handleClear}
              colors={colors}
              PRIMARY_COLOR={PRIMARY_COLOR}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 20,
    paddingBottom: 0,
  },
  headerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  headerTitle: {
    fontWeight: "bold",
    color: PRIMARY_COLOR,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingHorizontal: 10,
  },
  card: {
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  titleStyle: {
    paddingRight: 0,
  },
  titleRightContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  statusChipText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  expandedContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  detailHeader: {
    fontWeight: "bold",
    marginBottom: 8,
    color: PRIMARY_COLOR,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailIcon: {
    marginRight: 8,
    width: 20,
  },
  detailText: {
    fontSize: 14,
    flexShrink: 1,
    color: "#333",
  },
  expandedActions: {
    marginTop: 15,
    alignItems: "flex-start",
  },
  toggleButtonContent: {
    margin: 0,
    padding: 0,
    minWidth: 40,
    height: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    marginTop: 50,
  },
});

export default NotificationsManager;
