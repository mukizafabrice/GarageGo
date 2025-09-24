// screens/admin/AdminDashboard.js
import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { Card, Text, Button, Title, Paragraph } from "react-native-paper";
import { fetchUsers } from "../../services/AuthService";
import { getGarages } from "../../services/garageService";

const AdminDashboard = () => {
  const [usersCount, setUsersCount] = useState(0);
  const [garagesCount, setGaragesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardData();
  }, []);

  const getDashboardData = async () => {
    try {
      setLoading(true);
      const usersRes = await fetchUsers();
      const garagesRes = await getGarages();

      setUsersCount(usersRes.data.length);
      setGaragesCount(garagesRes.data.length);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.dashboardTitle}>Admin Dashboard</Text>

      <View style={styles.cardContainer}>
        <Card style={[styles.card, { backgroundColor: "#4CAF50" }]}>
          <Card.Content>
            <Title style={styles.cardTitle}>Total Garages</Title>
            <Paragraph style={styles.cardValue}>{garagesCount}</Paragraph>
          </Card.Content>
        </Card>

        <Card style={[styles.card, { backgroundColor: "#4CAF50" }]}>
          <Card.Content>
            <Title style={styles.cardTitle}>Total Users</Title>
            <Paragraph style={styles.cardValue}>{usersCount}</Paragraph>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.quickActions}>
        <Button
          mode="contained"
          style={styles.actionButton}
          onPress={() =>
            Alert.alert("Add Garage", "Navigate to add garage screen")
          }
        >
          Add Garage
        </Button>

        <Button
          mode="contained"
          style={styles.actionButton}
          onPress={() =>
            Alert.alert("Manage Users", "Navigate to user management")
          }
        >
          Manage Users
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F5F5F5",
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 16,
    alignSelf: "center",
  },
  cardContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  card: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 12,
    elevation: 5,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  cardValue: {
    color: "#FFFFFF",
    fontSize: 22,
    marginTop: 8,
    fontWeight: "bold",
  },
  quickActions: {
    marginTop: 20,
    justifyContent: "center",
  },
  actionButton: {
    marginVertical: 6,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingVertical: 8,
  },
});

export default AdminDashboard;
