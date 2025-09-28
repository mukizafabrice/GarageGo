import React, { useState } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  Text,
  Card,
  Button,
  Divider,
  useTheme,
  List,
  IconButton,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// --- Configuration ---
const PRIMARY_COLOR = "#4CAF50";
const SCREEN_WIDTH = Dimensions.get("window").width;

// --- Dummy Data ---
const dummyUser = {
  name: "Alex Johnson",
  role: "Manager",
};

const stats = [
  // Using MaterialCommunityIcons names
  {
    id: 1,
    title: "Jobs Active",
    value: 14,
    icon: "car-settings",
    color: PRIMARY_COLOR,
    secondaryColor: PRIMARY_COLOR,
  },
  {
    id: 2,
    title: "Daily Revenue",
    value: "$2,850",
    icon: "currency-usd",
    color: "#FF9800",
    secondaryColor: "#FF9800",
  },
  {
    id: 3,
    title: "Available Bays",
    value: 3,
    icon: "garage-open",
    color: "#2196F3",
    secondaryColor: "#2196F3",
  },
];

const activeJobs = [
  {
    id: "J0045",
    customer: "Sarah Connor",
    vehicle: "Tesla Model 3",
    status: "In Progress (Engine)",
    timeIn: "10:30 AM",
    badgeColor: "#FFC107",
    statusColor: "#D29400",
  },
  {
    id: "J0044",
    customer: "John Doe",
    vehicle: "Ford F-150",
    status: "Waiting Parts (Tires)",
    timeIn: "08:00 AM",
    badgeColor: "#00BCD4",
    statusColor: "#0097A7",
  },
  {
    id: "J0043",
    customer: "Lisa Smith",
    vehicle: "Honda Civic",
    status: "Ready for Pickup (Oil Change)",
    timeIn: "Yesterday",
    badgeColor: PRIMARY_COLOR,
    statusColor: PRIMARY_COLOR,
  },
];

const quickActions = [
  { icon: "plus-circle-outline", label: "New Job", action: "NewJob" },
  {
    icon: "calendar-clock-outline",
    label: "View Schedule",
    action: "Schedule",
  },
  { icon: "warehouse", label: "Manage Inventory", action: "Inventory" },
  { icon: "account-multiple-outline", label: "Team Status", action: "Team" },
];

// --- Utility Functions ---
const handleAction = (action) => {
  Alert.alert("Dashboard Action", `Navigating to ${action} screen...`);
};

// --- Sub-Components ---

/**
 * Component for displaying key statistical metrics using react-native-paper.
 */
const StatCard = ({ title, value, icon, color }) => {
  const { colors } = useTheme();
  return (
    <Card
      style={[
        styles.statCard,
        {
          backgroundColor: colors.surface,
          borderColor: color + "33",
          borderWidth: 1,
        },
      ]}
    >
      <View style={styles.statContent}>
        <View style={styles.statIconContainer}>
          <MaterialCommunityIcons name={icon} size={28} color={color} />
        </View>
        <Text
          variant="titleMedium"
          style={[styles.statValue, { color: color }]}
        >
          {value}
        </Text>
        <Text
          variant="bodySmall"
          style={{ color: colors.onSurfaceVariant, marginTop: 4 }}
        >
          {title}
        </Text>
      </View>
    </Card>
  );
};

/**
 * Main Garage Dashboard Component
 */
const App = () => {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* 1. Header and Welcome */}
      <View style={[styles.header, { borderBottomColor: colors.outline }]}>
        <View>
          <Text
            variant="headlineSmall"
            style={{ fontWeight: "600", color: colors.onBackground }}
          >
            Welcome Back, {dummyUser.name}!
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: colors.onSurfaceVariant, marginTop: 4 }}
          >
            Garage Overview for Today
          </Text>
        </View>
        <IconButton
          icon="bell-outline"
          size={26}
          onPress={() => handleAction("Notifications")}
          iconColor={PRIMARY_COLOR}
          style={styles.notificationButton}
        />
      </View>

      {/* 2. Key Performance Indicators (KPIs) */}
      <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
        TODAY'S METRICS
      </Text>
      <View style={styles.statsContainer}>
        {stats.map((stat) => (
          <StatCard
            key={stat.id}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </View>

      <Divider style={styles.divider} />

      {/* 3. Quick Actions */}
      <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
        QUICK ACTIONS
      </Text>
      <View style={styles.actionsContainer}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.action}
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={() => handleAction(action.action)}
          >
            <MaterialCommunityIcons
              name={action.icon}
              size={32}
              color={PRIMARY_COLOR}
            />
            <Text
              variant="labelMedium"
              style={[styles.actionLabel, { color: colors.onSurface }]}
            >
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Divider style={styles.divider} />

      {/* 4. Active Job List */}
      <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
        ACTIVE JOBS ({activeJobs.length})
      </Text>
      <Card style={[styles.jobsCard, { backgroundColor: colors.surface }]}>
        <List.Section style={{ paddingHorizontal: 0, margin: 0 }}>
          {activeJobs.map((job, index) => (
            <React.Fragment key={job.id}>
              <List.Item
                title={`${job.customer} - ${job.vehicle}`}
                description={job.status}
                titleStyle={styles.jobTitle}
                descriptionStyle={{ color: job.statusColor, fontWeight: "600" }}
                left={() => (
                  <View
                    style={[
                      styles.jobIcon,
                      { backgroundColor: job.badgeColor },
                    ]}
                  >
                    <Text variant="labelSmall" style={styles.jobIdText}>
                      {job.id}
                    </Text>
                  </View>
                )}
                right={() => (
                  <View style={styles.jobRight}>
                    <Text
                      variant="bodySmall"
                      style={{ color: colors.onSurfaceVariant, marginRight: 5 }}
                    >
                      {job.timeIn}
                    </Text>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={20}
                      color={colors.outline}
                    />
                  </View>
                )}
                onPress={() => handleAction(`Job Details for ${job.id}`)}
                style={{ paddingVertical: 10 }}
              />
              {index < activeJobs.length - 1 && (
                <Divider style={styles.jobDivider} />
              )}
            </React.Fragment>
          ))}
        </List.Section>
        <Button
          mode="text"
          labelStyle={{ color: PRIMARY_COLOR, fontWeight: "bold" }}
          onPress={() => handleAction("View All Jobs")}
          style={styles.viewAllButton}
        >
          View All Jobs
        </Button>
      </Card>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50, // For mobile status bar padding
    paddingBottom: 15,
  },
  notificationButton: {
    marginRight: -10,
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 20,
    marginTop: 15,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  divider: {
    marginVertical: 15,
    marginHorizontal: 20,
  },

  // KPI Stats Styles
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    paddingHorizontal: 10,
  },
  statCard: {
    width: SCREEN_WIDTH * 0.29, // ~3 items per row
    margin: 4,
    padding: 8,
    borderRadius: 12,
    elevation: 3,
  },
  statContent: {
    alignItems: "center",
    paddingVertical: 5,
  },
  statValue: {
    fontWeight: "bold",
  },
  statIconContainer: {
    marginBottom: 5,
  },

  // Quick Actions Styles
  actionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  actionButton: {
    width: "48%", // Two items per row with spacing
    aspectRatio: 1.5, // Maintain aspect ratio
    borderRadius: 12,
    padding: 15,
    marginVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  actionLabel: {
    marginTop: 8,
    fontWeight: "600",
    textAlign: "center",
  },

  // Active Jobs Styles
  jobsCard: {
    marginHorizontal: 20,
    borderRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },
  jobTitle: {
    fontWeight: "600",
    fontSize: 16,
  },
  jobIcon: {
    width: 45,
    height: 45,
    borderRadius: 8,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  jobIdText: {
    fontWeight: "bold",
    color: "#FFFFFF",
    fontSize: 10,
  },
  jobRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  jobDivider: {
    marginHorizontal: 15,
  },
  viewAllButton: {
    marginVertical: 5,
    marginHorizontal: 10,
  },
});

export default App;
