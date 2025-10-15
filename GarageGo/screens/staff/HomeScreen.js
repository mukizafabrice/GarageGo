import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Linking,
} from "react-native";
import { AntDesign, Feather } from "@expo/vector-icons";

// --- Service Imports (Assuming these are correctly implemented) ---
import { getGarageByUserId } from "../../services/garageService";
import { useAuth } from "../../context/AuthContext";
import {
  fetchNewRequestsCount,
  fetchActiveJobsCount,
  fetchAcceptanceRate,
  fetchGarageAcceptedNotifications,
  fetchSentSuccessNotifications,
  updateNotificationStatus,
  fetchServiceCompletedNotifications,
} from "../../services/statsService";

// --- CONSTANTS ---
const PRIMARY_COLOR = "#4CAF50";
const ALERT_COLOR = "#FF9800";
const DECLINED_COLOR = "#E53935";
const ACCEPTED_COLOR = PRIMARY_COLOR;
const AUTO_REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes in milliseconds

// --- 1. REUSABLE COMPONENT: StatBox ---
const StatBox = ({ title, value, unit = "", color }) => (
  <View style={styles.statBox}>
    <Text style={[styles.statValue, { color: color }]}>
      {value}
      {unit}
    </Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

// --- 2. REUSABLE COMPONENT: NotificationCard ---
const NotificationCard = ({
  notif,
  onAccept,
  onDecline,
  navigation,
  garageCoords,
}) => {
  const getStatusStyle = (status) => {
    switch (status) {
      case "SENT_SUCCESS":
        return { color: ALERT_COLOR, text: "NEW REQUEST" };
      case "GARAGE_ACCEPTED":
        return { color: ACCEPTED_COLOR, text: "ACTIVE JOB" };
      case "GARAGE_DECLINED":
      case "SEND_FAILED":
        return { color: DECLINED_COLOR, text: "DECLINED/FAILED" };
      case "SERVICE_COMPLETED":
        return { color: "#757575", text: "COMPLETED" };
      default:
        return { color: "#9E9E9E", text: "PENDING" };
    }
  };

  const statusInfo = getStatusStyle(notif.notificationStatus);
  const isActionable = notif.notificationStatus === "SENT_SUCCESS";
  const isAccepted = notif.notificationStatus === "GARAGE_ACCEPTED";

  const locationText = notif.driverLocation?.coordinates
    ? `(${notif.driverLocation.coordinates.join(", ")})`
    : "Unknown Location";

  // --- Linking Handlers ---
  const handleCall = () => {
    const phoneNumber = notif.driverPhoneNumber;
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert("Error", "Driver phone number is unavailable.");
    }
  };

  const handleWhatsApp = () => {
    const phoneNumber = notif.driverPhoneNumber;
    const driverName = notif.driverName;
    if (phoneNumber && driverName) {
      // Remove any non-numeric characters and ensure it starts with country code
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const whatsappUrl = `whatsapp://send?phone=${cleanPhone}&text=Hi ${driverName}, this is ${garageCoords ? 'your garage' : 'the garage'}. We're on our way to help you.`;
      Linking.openURL(whatsappUrl).catch(() => {
        Alert.alert("Error", "WhatsApp is not installed on this device.");
      });
    } else {
      Alert.alert("Error", "Driver information is unavailable.");
    }
  };

  const getTimeAgo = (createdAt) => {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffMs = now - createdDate;

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60)
      return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

    // Anything beyond 1 day still shows "Yesterday" in the original logic
    return "Yesterday";
  };

  const handleNavigate = () => {
    const driverCoords = notif.driverLocation?.coordinates;

    if (!navigation) {
      Alert.alert("Error", "Navigation object is missing. Cannot navigate.");
      return;
    }

    // CRITICAL CHECK: Ensure both driver and garage coordinates are available
    if (
      driverCoords &&
      driverCoords.length === 2 &&
      garageCoords?.lat &&
      garageCoords?.lon
    ) {
      const [driverLatitude, driverLongitude] = driverCoords;

      // Pass all necessary job details for the DriverLocationScreen
      navigation.navigate("driverLocation", {
        driverLatitude: driverLatitude,
        driverLongitude: driverLongitude,
        driverName: notif.driverName,

        // Garage Coordinates for Origin/Start Point
        garageLatitude: garageCoords.lat,
        garageLongitude: garageCoords.lon,

        // NEW: CRITICAL PARAMS FOR COMPLETION
        notificationId: notif._id,
        garageId: notif.garageId,
      });
    } else {
      Alert.alert(
        "Error",
        "Driver location or Garage location is not available for navigation."
      );
    }
  };

  const handleNavigateAndCall = () => {
    Alert.alert(
      "Job Actions",
      "What would you like to do for this active job?",
      [
        {
          text: "Navigate to Location",
          onPress: handleNavigate,
        },
        {
          text: "Call Driver",
          onPress: handleCall,
        },
        {
          text: "WhatsApp Driver",
          onPress: handleWhatsApp,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };
  // -------------------------

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardDriverName}>Driver: {notif.driverName}</Text>
        <Text
          style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}
        >
          {statusInfo.text}
        </Text>
      </View>

      <Text style={styles.cardDetail}>Phone: {notif.driverPhoneNumber}</Text>
      <Text style={styles.cardDetail}>
        Request Time: {getTimeAgo(notif.createdAt)}
      </Text>
      <Text style={styles.cardDetail}>Location: {locationText}</Text>

      {isActionable && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: PRIMARY_COLOR }]}
            onPress={() => onAccept(notif)}
          >
            <AntDesign name="checkcircle" size={16} color="white" />
            <Text style={styles.actionButtonText}>Accept Job</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={() => onDecline(notif)}
          >
            <AntDesign name="closecircle" size={16} color={DECLINED_COLOR} />
            <Text style={[styles.actionButtonText, { color: DECLINED_COLOR }]}>
              Decline
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {isAccepted && (
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: "#2196F3", marginTop: 10 },
          ]}
          onPress={handleNavigateAndCall}
        >
          <Feather name="navigation" size={16} color="white" />
          <Text style={styles.actionButtonText}>Navigate & Call</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// --- 3. MAIN COMPONENT: Dashboard ---
const GarageOwnerDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const userId = user?._id;

  const [garage, setGarage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // --- State for Stats & Notifs ---
  const [countRequest, setCountRequest] = useState(0);
  const [countActiveJobs, setCountActiveJobs] = useState(0);
  const [acceptanceRate, setAcceptanceRate] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // Function to fetch all data
  const fetchData = useCallback(async (garageId) => {
    if (!garageId) return;

    setIsLoading(true);
    try {
      // 1. Fetch Stats
      const [requests, activeJobs, acceptance] = await Promise.all([
        fetchNewRequestsCount(garageId),
        fetchActiveJobsCount(garageId),
        fetchAcceptanceRate(garageId),
      ]);

      setCountRequest(requests?.count || 0);
      setCountActiveJobs(activeJobs?.count || 0);
      setAcceptanceRate(Math.round(acceptance?.acceptanceRate || 0));

      // 2. Fetch Notifications (Using the simplified backend structure)
      const [sentSuccess, accepted, completed] = await Promise.all([
        fetchSentSuccessNotifications(garageId),
        fetchGarageAcceptedNotifications(garageId),
        fetchServiceCompletedNotifications(garageId),
      ]);

      const allNotifs = [
        ...(sentSuccess?.data || []),
        ...(accepted?.data || []),
        ...(completed?.data || []),
      ];

      // Sort: New Requests > Accepted Jobs > Completed Jobs
      allNotifs.sort((a, b) => {
        const statusOrder = {
          SENT_SUCCESS: 3,
          GARAGE_ACCEPTED: 2,
          SERVICE_COMPLETED: 1,
        };
        return (
          (statusOrder[b.notificationStatus] || 0) -
          (statusOrder[a.notificationStatus] || 0)
        );
      });

      setNotifications(allNotifs);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect 1: Fetch Garage Data (Runs once)
  useEffect(() => {
    const fetchMyGarage = async () => {
      if (userId) {
        try {
          // This should fetch the garage data including its own latitude/longitude
          const response = await getGarageByUserId(userId);
          if (response && response.data) {
            setGarage(response.data);
          }
        } catch (error) {
          console.error("Error fetching garage:", error);
        }
      }
    };
    fetchMyGarage();
  }, [userId]);

  // Effect 2: Initial Data Fetch and Auto-Refresh (Runs when garage is set)
  useEffect(() => {
    if (garage?._id) {
      const garageId = garage._id;

      // 1. Initial Fetch
      fetchData(garageId);

      // 2. Set up Auto-Refresh Interval (10 minutes)
      const intervalId = setInterval(() => {
        console.log(`Auto-refreshing dashboard for garage: ${garageId}`);
        fetchData(garageId);
      }, AUTO_REFRESH_INTERVAL_MS);

      // 3. Cleanup function to clear the interval
      return () => {
        console.log("Clearing dashboard auto-refresh interval.");
        clearInterval(intervalId);
      };
    }
  }, [garage?._id, fetchData]);

  // --- Action Handlers for Accept/Decline (Unchanged) ---
  const handleUpdateStatus = async (
    notification,
    newStatus,
    successMessage,
    errorMessage
  ) => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      await updateNotificationStatus(notification._id, newStatus);
      Alert.alert("Success", successMessage);
      await fetchData(garage._id);
    } catch (error) {
      console.error(
        `Error updating notification ${notification._id} to ${newStatus}:`,
        error
      );
      Alert.alert("Error", errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAccept = (notif) => {
    handleUpdateStatus(
      notif,
      "GARAGE_ACCEPTED",
      "Job accepted successfully! You can now navigate/call the driver.",
      "Failed to accept job. Please check your connection."
    );
  };

  const handleDecline = (notif) => {
    handleUpdateStatus(
      notif,
      "GARAGE_DECLINED",
      "Request declined.",
      "Failed to decline request. Please try again."
    );
  };
  // ------------------------------------------------

  return (
    <View style={styles.container}>
      {/* 1. Header */}
      <View style={styles.header}>
        <Text style={styles.greetingText}>
          Welcome, {garage ? garage.name : "Loading..."}
        </Text>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </View>

      {/* 2. Summary Grid (Metrics) */}
      <View style={styles.statsGrid}>
        <StatBox
          title="New Requests"
          value={countRequest}
          color={ALERT_COLOR}
        />
        <StatBox
          title="Active Jobs"
          value={countActiveJobs}
          color={ACCEPTED_COLOR}
        />
        <StatBox
          title="Avg. Acceptance"
          value={acceptanceRate}
          unit="%"
          color={PRIMARY_COLOR}
        />
      </View>

      {/* 3. Live Request Feed */}
      <Text style={styles.sectionTitle}>Live Service Requests</Text>
      <ScrollView
        style={styles.feedContainer}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && !isUpdating}
            onRefresh={() => fetchData(garage?._id)}
          />
        }
      >
        {isLoading && notifications.length === 0 && !isUpdating ? (
          <Text style={styles.emptyText}>Loading dashboard data...</Text>
        ) : notifications.length > 0 ? (
          notifications.map((notif) => (
            <NotificationCard
              key={notif._id || notif.id}
              notif={notif}
              onAccept={handleAccept}
              onDecline={handleDecline}
              navigation={navigation}
              // PASSING GARAGE COORDS: These were fetched in useEffect 1
              garageCoords={
                garage?.latitude && garage?.longitude
                  ? { lat: garage.latitude, lon: garage.longitude }
                  : null
              }
            />
          ))
        ) : (
          <Text style={styles.emptyText}>No service requests found.</Text>
        )}
        <View style={{ height: 50 }} />
      </ScrollView>

      {isUpdating && (
        <Text style={styles.updatingText}>Updating status...</Text>
      )}
    </View>
  );
};

// --- 4. STYLESHEET ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F4F8",
    paddingTop: 40,
    paddingHorizontal: 15,
  },
  header: {
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    marginBottom: 10,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  dateText: {
    fontSize: 14,
    color: "#777",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  statBox: {
    width: "32%",
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 3,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#777",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
    marginBottom: 8,
  },
  feedContainer: {
    flex: 1,
  },
  // NotificationCard Styles
  card: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  cardDriverName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: "bold",
    color: "white",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 15,
    overflow: "hidden",
  },
  cardDetail: {
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: "row",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    paddingTop: 10,
  },
  actionButton: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  declineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: DECLINED_COLOR,
  },
  actionButtonText: {
    color: "white",
    marginLeft: 5,
    fontWeight: "600",
    fontSize: 14,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#777",
    fontSize: 16,
  },
  updatingText: {
    textAlign: "center",
    padding: 10,
    color: PRIMARY_COLOR,
    backgroundColor: "#E8F5E9",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default GarageOwnerDashboard;
