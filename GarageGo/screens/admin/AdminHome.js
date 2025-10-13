import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Card,
  Text,
  Button,
  Title,
  Paragraph,
  useTheme,
  ActivityIndicator,
  List,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { fetchUsers } from "../../services/AuthService";
import { getGarages } from "../../services/garageService";

// Define Brand Color
const PRIMARY_COLOR = "#4CAF50";

const AdminDashboard = ({ navigation }) => {
  const { colors } = useTheme();
  const [usersCount, setUsersCount] = useState(0);
  const [garagesCount, setGaragesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    getDashboardData();
  }, []);

  const getDashboardData = async () => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));

      const usersRes = await fetchUsers();
      const garagesRes = await getGarages();

      setUsersCount(usersRes.data.length);
      setGaragesCount(garagesRes.data.length);

      const userActivities = usersRes.data.map((user, i) => ({
        id: `user-${user.id || `fallback-${i}`}`,
        title: `New User Registered: ${user.name || "Unknown User"}`,
        time: user.createdAt,
        icon: "account-plus",
        status: "Success",
      }));

      const garageActivities = garagesRes.data.map((garage, i) => ({
        id: `garage-${garage.id || `fallback-${i}`}`,
        title: `New Garage Listed: "${garage.name || "Unknown Garage"}"`,
        time: garage.createdAt,
        icon: "car-wash",
        status: "Success",
      }));

      // const internalActivities = [
      //   {
      //     id: "internal-1",
      //     title: "Admin Login Successful",
      //     time: new Date(Date.now() - 60000 * 1),
      //     icon: "login",
      //     status: "Info",
      //   },
      //   {
      //     id: "internal-2",
      //     title: "Database Backup Completed",
      //     time: new Date(Date.now() - 60000 * 50),
      //     icon: "database-check",
      //     status: "Success",
      //   },
      // ];

      const allActivities = [...userActivities, ...garageActivities]
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 5);

      setRecentActivities(allActivities);
    } catch (error) {
      console.error("Dashboard Data Fetch Error:", error);
      Alert.alert(
        "Error",
        "Failed to fetch dashboard data. Check network or service layer implementation."
      );
      setUsersCount(0);
      setGaragesCount(0);
      setRecentActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Success":
        return PRIMARY_COLOR;
      case "Warning":
        return "#FF9800";
      case "Info":
        return "#2196F3";
      default:
        return colors.onSurfaceVariant;
    }
  };

  const formatActivityTime = (date) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffInMinutes = Math.floor((now - dateObj) / (1000 * 60));

    if (diffInMinutes < 1) {
      return "just now";
    }
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    }
    if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    }
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={{ marginTop: 10, color: colors.onSurface }}>
          Loading Dashboard Data...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.dashboardTitle, { color: PRIMARY_COLOR }]}>
          GarageGo Admin Overview
        </Text>
        <Text style={[styles.dateText, { color: colors.onSurfaceVariant }]}>
          Analytics as of{" "}
          {new Date().toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Title style={{ color: colors.onSurface }}>Key Metrics</Title>
      </View>
      <View style={styles.cardContainer}>
        <Card
          style={[
            styles.metricCard,
            { backgroundColor: colors.surface, borderColor: PRIMARY_COLOR },
          ]}
          onPress={() => navigation.navigate("ManageGarages")}
        >
          <Card.Content style={styles.cardContent}>
            <MaterialCommunityIcons
              name="tools"
              size={32}
              color={PRIMARY_COLOR}
            />
            <View style={styles.textData}>
              <Paragraph style={[styles.cardValue, { color: PRIMARY_COLOR }]}>
                {garagesCount}
              </Paragraph>
              <Title style={[styles.cardTitle, { color: colors.onSurface }]}>
                Garages
              </Title>
            </View>
          </Card.Content>
        </Card>

        <Card
          style={[
            styles.metricCard,
            { backgroundColor: colors.surface, borderColor: "#FF9800" },
          ]}
          onPress={() => navigation.navigate("Users")}
        >
          <Card.Content style={styles.cardContent}>
            <MaterialCommunityIcons
              name="account-group"
              size={32}
              color={"#FF9800"}
            />
            <View style={styles.textData}>
              <Paragraph style={[styles.cardValue, { color: "#FF9800" }]}>
                {usersCount}
              </Paragraph>
              <Title style={[styles.cardTitle, { color: colors.onSurface }]}>
                Users
              </Title>
            </View>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.sectionHeader}>
        <Title style={{ color: colors.onSurface }}>Quick Actions</Title>
      </View>
      <View style={styles.quickActions}>
        <Button
          mode="contained"
          icon="plus-circle-outline"
          style={styles.actionButton}
          onPress={() => navigation.navigate("AddGarage")}
        >
          Add Garage
        </Button>
        <Button
          mode="contained"
          icon="account-group-outline"
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate("Users")}
        >
          Manage Users
        </Button>
      </View>

      <View style={styles.sectionHeader}>
        <Title style={{ color: colors.onSurface }}>Recent Activity</Title>
      </View>
      <Card style={[styles.activityCard, { backgroundColor: colors.surface }]}>
        <List.Section>
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <List.Item
                key={activity.id}
                title={activity.title}
                description={formatActivityTime(activity.time)}
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon={activity.icon}
                    color={getStatusColor(activity.status)}
                  />
                )}
              />
            ))
          ) : (
            <Text style={styles.noActivityText}>
              No recent activities found.
            </Text>
          )}
          <Button
            mode="text"
            labelStyle={{ color: PRIMARY_COLOR }}
            style={{ marginTop: 10 }}
            onPress={() =>
              Alert.alert("View Log", "Navigate to Full Activity Log.")
            }
          >
            View Full Log
          </Button>
        </List.Section>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 20,
    alignItems: "center",
  },
  dashboardTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  dateText: {
    fontSize: 14,
    marginTop: 4,
  },
  sectionHeader: {
    marginBottom: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  cardContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 12,
    elevation: 4,
    borderLeftWidth: 5,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  textData: {
    marginLeft: 15,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.7,
  },
  cardValue: {
    fontSize: 30,
    fontWeight: "bold",
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 5,
  },
  secondaryButton: {
    backgroundColor: "#FF9800",
  },
  activityCard: {
    borderRadius: 12,
    elevation: 2,
    paddingVertical: 0,
  },
  noActivityText: {
    padding: 15,
    textAlign: "center",
    color: "#888",
  },
});

export default AdminDashboard;
