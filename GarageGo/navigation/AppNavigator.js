import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

// Import Admin Screens
import AdminHome from "../screens/admin/AdminHome";
import AdminGarages from "../screens/admin/AdminGarages";
import AdminSettings from "../screens/admin/AdminSettings";
import AddGarage from "../screens/admin/AddGarageScreen";
import EditGarage from "../screens/admin/EditGarageScreen";
import UserScreen from "../screens/admin/UserScreen";
// import UserDetails from "../screens/admin/UserDetails";

// Import Garage Screens
import GarageHome from "../screens/garage/GarageHome";
import Traveller from "../screens/garage/Traveller";
import GarageSettings from "../screens/garage/GarageSettings";
// import AddVehicle from "../screens/garage/AddVehicle";
// import DriverDetails from "../screens/garage/DriverDetails";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- Admin Tabs ---
const AdminTabs = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: "#1B5E20",
      tabBarInactiveTintColor: "#4CAF50",
      tabBarStyle: styles.tabBar,
      headerStyle: { backgroundColor: "#4CAF50" },
      headerTintColor: "#fff",
      headerTitleStyle: { fontWeight: "bold" },
    }}
  >
    <Tab.Screen
      name="Home"
      component={AdminHome}
      options={{
        tabBarLabel: "Home",
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="home" color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen
      name="Garages"
      component={AdminGarages}
      options={{
        tabBarLabel: "Garages",
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="garage" color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen
      name="Users"
      component={UserScreen}
      options={{
        tabBarLabel: "Users",
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons
            name="account-group"
            color={color}
            size={size}
          />
        ),
      }}
    />
    <Tab.Screen
      name="Settings"
      component={AdminSettings}
      options={{
        tabBarLabel: "Settings",
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="cog" color={color} size={size} />
        ),
      }}
    />
  </Tab.Navigator>
);

// --- Garage Tabs ---
const GarageTabs = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: "#4CAF50",
      tabBarInactiveTintColor: "#1B5E20",
      tabBarStyle: styles.tabBar,
      headerStyle: { backgroundColor: "#4CAF50" },
      headerTintColor: "#fff",
      headerTitleStyle: { fontWeight: "bold" },
    }}
  >
    <Tab.Screen
      name="Home"
      component={GarageHome}
      options={{
        tabBarLabel: "Home",
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="home" color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen
      name="Traveller"
      component={Traveller}
      options={{
        tabBarLabel: "Traveller",
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons
            name="car-multiple"
            color={color}
            size={size}
          />
        ),
      }}
    />
    <Tab.Screen
      name="GarageSettings"
      component={GarageSettings}
      options={{
        tabBarLabel: "Settings",
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="cog" color={color} size={size} />
        ),
      }}
    />
  </Tab.Navigator>
);

// --- Loading Screen ---
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#4CAF50" />
  </View>
);

// --- App Navigator ---
const AppNavigator = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user?.role === "admin" ? (
        <>
          {/* Admin Tabs */}
          <Stack.Screen name="AdminTabs" component={AdminTabs} />

          {/* Stack screens outside tabs */}
          <Stack.Screen
            name="AddGarage"
            component={AddGarage}
            options={{
              headerShown: true,
              title: "Add Garage",
              headerStyle: { backgroundColor: "#4CAF50" },
            }}
          />
          <Stack.Screen
            name="EditGarage"
            component={EditGarage}
            options={{
              headerShown: true,
              title: "Edit Garage",
              headerStyle: { backgroundColor: "#4CAF50" },
            }}
          />
          {/* <Stack.Screen
            name="UserDetails"
            component={UserDetails}
            options={{ headerShown: true, title: "User Details" }}
          /> */}
        </>
      ) : (
        <>
          {/* Garage Tabs */}
          <Stack.Screen name="GarageTabs" component={GarageTabs} />

          {/* Stack screens outside tabs */}
          {/* <Stack.Screen
            name="AddVehicle"
            component={AddVehicle}
            options={{ headerShown: true, title: "Add Vehicle" }}
          /> */}
          {/* <Stack.Screen
            name="DriverDetails"
            component={DriverDetails}
            options={{ headerShown: true, title: "Driver Details" }}
          /> */}
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#FFFFFF",
    borderTopColor: "#E0E0E0",
    borderTopWidth: 1,
    height: 65,
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
