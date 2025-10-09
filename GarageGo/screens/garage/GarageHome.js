import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { AntDesign, Feather } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { getGarageByUserId } from "../../services/garageService";
import { updateNotificationStatusAction } from "../../services/notificationService";
import { useAuth } from "../../context/AuthContext";
import { fetchDashboardStats } from "../../services/statsService";
// --- CONSTANTS ---
const PRIMARY_COLOR = "#4CAF50";
const ALERT_COLOR = "#FF9800"; // For new/pending requests
const DECLINED_COLOR = "#E53935"; // For declined/failed
const ACCEPTED_COLOR = PRIMARY_COLOR; // For accepted jobs

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
// This component displays a single service request
const NotificationCard = ({ notif }) => {
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
        Request Time: {notif.timeAgo || "Just now"}
      </Text>
      <Text style={styles.cardDetail}>
        Location: ({notif.driverLocation.coordinates.join(", ")})
      </Text>

      {isActionable && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: PRIMARY_COLOR }]}
          >
            <AntDesign name="checkcircleo" size={16} color="white" />
            <Text style={styles.actionButtonText}>Accept Job</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.declineButton]}>
            <AntDesign name="closecircleo" size={16} color={DECLINED_COLOR} />
            <Text style={[styles.actionButtonText, { color: DECLINED_COLOR }]}>
              Decline
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {!isActionable && notif.notificationStatus === "GARAGE_ACCEPTED" && (
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: "#2196F3", marginTop: 10 },
          ]}
        >
          <Feather name="navigation" size={16} color="white" />
          <Text style={styles.actionButtonText}>Navigate & Call</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// --- 3. MAIN COMPONENT: Dashboard ---
const GarageOwnerDashboard = () => {
  const { user } = useAuth();
  const userId = user?._id;
  const [garage, setGarage] = useState(null);

  useEffect(() => {
    const fetchMyGarage = async () => {
      if (userId) {
        const garageData = await getGarageByUserId(userId);

        setGarage(garageData);
      }
    };
    fetchMyGarage();
  }, []);
  // --- MOCK DATA (Replace with API/Redux Data) ---
  const MOCK_STATS = {
    newRequests: 5,
    activeJobs: 3,
    acceptanceRate: 92,
  };
  const MOCK_NOTIFICATIONS = [
    {
      id: 1,
      driverName: "Sarah Connor",
      driverPhoneNumber: "555-0101",
      driverLocation: { coordinates: [40.71, -74.0] },
      notificationStatus: "SENT_SUCCESS",
      timeAgo: "2 mins ago",
    },
    {
      id: 2,
      driverName: "John Doe",
      driverPhoneNumber: "555-0202",
      driverLocation: { coordinates: [40.75, -73.98] },
      notificationStatus: "GARAGE_ACCEPTED",
      timeAgo: "1 hour ago",
    },
    {
      id: 3,
      driverName: "T-800",
      driverPhoneNumber: "555-0303",
      driverLocation: { coordinates: [40.68, -74.04] },
      notificationStatus: "SERVICE_COMPLETED",
      timeAgo: "1 day ago",
    },
  ];
  const GARAGE_NAME = "Central Auto Repair";
  // ------------------------------------------------

  return (
    <View style={styles.container}>
      {/* 1. Header */}
      <View style={styles.header}>
        <Text style={styles.greetingText}>Welcome, {GARAGE_NAME}</Text>
        <Text style={styles.dateText}>Thursday, Oct 9, 2025</Text>
      </View>

      {/* 2. Summary Grid (Metrics) */}
      <View style={styles.statsGrid}>
        <StatBox
          title="New Requests"
          value={MOCK_STATS.newRequests}
          color={ALERT_COLOR}
        />
        <StatBox
          title="Active Jobs"
          value={MOCK_STATS.activeJobs}
          color={ACCEPTED_COLOR}
        />
        <StatBox
          title="Avg. Acceptance"
          value={MOCK_STATS.acceptanceRate}
          unit="%"
          color={PRIMARY_COLOR}
        />
      </View>

      {/* 3. Live Request Feed */}
      <Text style={styles.sectionTitle}>Live Service Requests</Text>
      <ScrollView style={styles.feedContainer}>
        {MOCK_NOTIFICATIONS.map((notif) => (
          <NotificationCard key={notif.id} notif={notif} />
        ))}
        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
};

// --- 4. STYLESHEET ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F4F8", // Slightly more modern background
    paddingTop: 40, // For notch/safe area
    paddingHorizontal: 15,
  },
  header: {
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    marginBottom: 10,
  },
  greetingText: {
    fontSize: 26,
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
    fontSize: 30,
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
});

export default GarageOwnerDashboard;
