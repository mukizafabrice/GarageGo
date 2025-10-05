import React, { useState } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import {
  Text,
  Avatar,
  useTheme,
  ActivityIndicator,
  Button,
  Card,
  Chip,
} from "react-native-paper";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const PRIMARY_COLOR = "#4CAF50";

// Helper for status color
const statusColor = (status, colors) => {
  switch (status) {
    case "SENT_SUCCESS":
      // Successful notification sent (Note: This is now filtered from mock data)
      return PRIMARY_COLOR;
    case "NO_GARAGE_FOUND":
      // Error: Failed to assign to a garage
      return colors.error;
    case "INVALID_TOKEN":
      // Warning: Driver token issue
      return "#FFA000";
    case "SEND_FAILED":
      // Error: Expo/Firebase failed to send
      return colors.error;
    case "SERVER_ERROR":
      // Neutral/Grey: Internal server issue
      return "#BDBDBD";
    default:
      return colors.backdrop;
  }
};

// Mock notifications data (Filtered: Removed SENT_SUCCESS item)
const mockNotifications = [
  {
    _id: "2",
    driverName: "Jane Smith",
    driverPhoneNumber: "+1987654321",
    driverLocation: { coordinates: [40.7128, -74.006] },
    nearestGarage: {},
    notificationStatus: "NO_GARAGE_FOUND",
    expoTicket: null,
    createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
  },
  {
    _id: "3",
    driverName: "Robert Fox",
    driverPhoneNumber: "+1555123456",
    driverLocation: { coordinates: [32.7767, -96.797] },
    nearestGarage: { garageId: "GARAGE456" },
    notificationStatus: "INVALID_TOKEN",
    expoTicket: "InvalidTokenX",
    createdAt: new Date(Date.now() - 7200 * 1000).toISOString(),
  },
];

// --------------------------------------------------------------------------
// NotificationCard COMPONENT
// Manages its own expansion state to keep the list clean.
// --------------------------------------------------------------------------
const NotificationCard = ({ notif, onClear, colors, PRIMARY_COLOR }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Function to format coordinates cleanly
  const formatCoordinates = (coords) => {
    if (!coords || coords.length < 2) return "N/A";
    const [lat, lng] = coords;
    return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
  };

  const statusBackground = statusColor(notif.notificationStatus, colors);

  return (
    <Card key={notif._id} style={styles.card}>
      <Card.Title
        title={notif.driverName || "Unknown Driver"}
        subtitle={notif.driverPhoneNumber}
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
          {/* Detailed Content */}
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
              Assigned Garage: {notif.nearestGarage?.garageId || "Not Assigned"}
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
                Ticket ID: {notif.expoTicket}
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
            <Text style={{ ...styles.detailText, color: colors.onSurfaceVariant }}>
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

      {/* The Card.Actions component is no longer rendered when the card is collapsed.
        The only removal button, "Clear Notification", is correctly placed inside the expanded view.
      */}
    </Card>
  );
};


// NOTE: Component signature updated to accept navigation prop
const NotificationsManager = ({ navigation }) => {
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState(mockNotifications);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch real data here
    setTimeout(() => {
      setRefreshing(false);
      // Simulate refetching data after refresh
      setNotifications(mockNotifications.slice(0, 2)); 
    }, 1000);
  };

  // Function to clear a single notification (replaces handleDelete)
  const handleClear = (id) => {
    setNotifications((prev) => prev.filter((notif) => notif._id !== id));
  };
  
  // New function to clear ALL notifications
  const handleClearAllNotifications = () => {
    setLoading(true);
    setTimeout(() => {
      setNotifications([]);
      setLoading(false);
    }, 500);
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
            No Driver Requests Found
          </Text>
          <Text
            style={{
              color: colors.onSurfaceVariant,
              textAlign: "center",
              marginTop: 5,
            }}
          >
            All active requests and notifications will appear here for management.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY_COLOR]} />
          }
        >
          {/* Map through notifications and render the new component */}
          {notifications.map((notif) => (
            <NotificationCard
              key={notif._id}
              notif={notif}
              onClear={handleClear} // Updated prop name to onClear
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
  // New style to contain the title and clear all button
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    overflow: 'hidden', // Ensures borders/shadows look correct on expansion
  },
  // Style for Card.Title to make space for the toggle
  titleStyle: {
    paddingRight: 0, 
  },
  titleRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  statusChipText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  // Styles for the expanded content
  expandedContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0', // Light divider for expanded section
  },
  detailHeader: {
    fontWeight: 'bold',
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
    width: 20, // Fixed width for icon alignment
  },
  detailText: {
    fontSize: 14,
    flexShrink: 1,
    color: '#333', // Dark text for readability
  },
  expandedActions: {
    marginTop: 15,
    alignItems: 'flex-start',
  },
  toggleButtonContent: {
    margin: 0,
    padding: 0,
    minWidth: 40,
    height: 40,
  },
  // We can keep this style, although the Card.Actions component is no longer rendered
  // in the collapsed state.
  cardActions: { 
    justifyContent: 'flex-end',
    paddingTop: 0,
    paddingRight: 8,
    height: 0, 
    padding: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
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
