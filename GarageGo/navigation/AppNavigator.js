import React from "react";
import { View, ActivityIndicator, StyleSheet, Platform, Dimensions } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

// --- Admin Screens ---
import AdminHome from "../screens/admin/AdminHome";
import AdminGarages from "../screens/admin/AdminGarages";
import AdminSettings from "../screens/admin/AdminSettings";
import AddGarage from "../screens/admin/AddGarageScreen";
import EditGarage from "../screens/admin/EditGarageScreen";
import UserScreen from "../screens/admin/UserScreen";
import AdminProfile from "../screens/admin/AdminProfile";
import NotificationAdmin from "../screens/admin/NotificationsAdmin";
import AdminReportsScreen from "../screens/admin/AdminReportsScreen";

// --- Garage Owner Screens ---
import Traveller from "../screens/garage/Traveller";
import GarageSettings from "../screens/garage/GarageSettings";
import GarageHome from "../screens/garage/GarageHome";
import UserManagementScreen from "../screens/garage/UserManagementScreen";
import NotificationsManager from "../screens/garage/NotificationsOwner";
import GarageProfile from "../screens/garage/GarageProfile";
import GarageReportsScreen from "../screens/garage/GarageReportsScreen";

// --- User Screens
import HomeScreen from "../screens/staff/HomeScreen";
import DriverScreen from "../screens/staff/DriverScreen";
import StaffSettingsScreen from "../screens/staff/StaffSettingsScreen";
import StaffProfile from "../screens/staff/StaffProfile";
// common screens

import Profile from "../screens/common/Profile";
// import Notifications from "../screens/common/Notifications";
import DriverLocation from "../screens/common/DriverLocation";
import Help from "../screens/common/HelpSupportScreen";
import LandingPage from "../screens/LandingPage";
import ChangePassword from "../screens/common/ChangePassword";
import SwitchMode from "../screens/common/SwitchModeScreen";
import Language from "../screens/common/LanguageScreen";
import Privacy from "../screens/common/PrivacyScreen";
const UserHome = () => (
  <View style={styles.centered}>
    <MaterialCommunityIcons name="account" size={60} color="#4CAF50" />
    <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 20 }} />
  </View>
);

// --- Stack & Tab Navigators ---
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Get device dimensions to detect home indicator
const { height: screenHeight } = Dimensions.get('window');

// Detect if device has home indicator (iPhone X and newer)
const hasHomeIndicator = Platform.OS === 'ios' && screenHeight >= 812;

const tabBarBaseStyle = {
  backgroundColor: "#fff",
  height: Platform.OS === "ios" ? 80 : 70,
  paddingBottom: Platform.OS === "ios" ? 20 : 10,
  paddingTop: 5,
  borderTopWidth: 0.5,
  borderTopColor: "#ccc",
  elevation: 5,
  // Position the tab bar above system navigation
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  // Ensure it doesn't overlap with system navigation
  ...(Platform.OS === "ios" && {
    paddingBottom: hasHomeIndicator ? 34 : 20, // Account for home indicator
  }),
};

const tabLabelStyle = {
  fontSize: 12,
  marginBottom: 5,
};

// --- Admin Tabs ---
const AdminTabs = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: "#1B5E20",
      tabBarInactiveTintColor: "#4CAF50",
      tabBarStyle: tabBarBaseStyle,
      tabBarLabelStyle: tabLabelStyle,
      headerStyle: { backgroundColor: "#4CAF50" },
      headerTintColor: "#fff",
      headerTitleStyle: { fontWeight: "bold" },
      tabBarShowLabel: true,
    }}
    safeAreaInsets={{ bottom: hasHomeIndicator ? 34 : 0 }}
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

// --- Garage Owner Tabs ---
const GarageOwnerTabs = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: "#1B5E20",
      tabBarInactiveTintColor: "#4CAF50",
      tabBarStyle: tabBarBaseStyle,
      tabBarLabelStyle: tabLabelStyle,
      headerStyle: { backgroundColor: "#4CAF50" },
      headerTintColor: "#fff",
      headerTitleStyle: { fontWeight: "bold" },
      tabBarShowLabel: true,
    }}
    safeAreaInsets={{ bottom: hasHomeIndicator ? 34 : 0 }}
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

// --- User Tabs ---
const UserTabs = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: "#1B5E20",
      tabBarInactiveTintColor: "#4CAF50",
      tabBarStyle: tabBarBaseStyle,
      tabBarLabelStyle: tabLabelStyle,
      headerStyle: { backgroundColor: "#4CAF50" },
      headerTintColor: "#fff",
      headerTitleStyle: { fontWeight: "bold" },
      tabBarShowLabel: true,
    }}
    safeAreaInsets={{ bottom: hasHomeIndicator ? 34 : 0 }}
  >
    <Tab.Screen
      name="HomeScreen"
      component={HomeScreen}
      options={{
        tabBarLabel: "Home",
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="home" color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen
      name="Driver"
      component={DriverScreen}
      options={{
        tabBarLabel: "Driver",
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="steering" color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen
      name="StaffSettings"
      component={StaffSettingsScreen}
      options={{
        tabBarLabel: "Staff Settings",
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons
            name="account-cog"
            color={color}
            size={size}
          />
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
          <Stack.Screen name="AdminTabs" component={AdminTabs} />
          <Stack.Screen
            name="AddGarage"
            component={AddGarage}
            options={{
              headerShown: true,
              title: "Add Garage",
              headerStyle: { backgroundColor: "#4CAF50" },
              headerTintColor: "#fff",
            }}
          />
          <Stack.Screen
            name="EditGarage"
            component={EditGarage}
            options={{
              headerShown: true,
              title: "Edit Garage",
              headerStyle: { backgroundColor: "#4CAF50" },
              headerTintColor: "#fff",
            }}
          />
          <Stack.Screen
            name="AdminProfile"
            component={AdminProfile}
            options={{
              headerShown: true,
              title: "Profile",
              headerStyle: { backgroundColor: "#4CAF50" },
              headerTintColor: "#fff",
            }}
          />
          <Stack.Screen
            name="NotificationAdmin"
            component={NotificationAdmin}
            options={{
              headerShown: true,
              title: "Manage Notifications",
              headerStyle: { backgroundColor: "#4CAF50" },
              headerTintColor: "#fff",
            }}
          />
          <Stack.Screen
            name="AdminReports"
            component={AdminReportsScreen}
            options={{
              headerShown: true,
              title: "System Reports",
              headerStyle: { backgroundColor: "#4CAF50" },
              headerTintColor: "#fff",
            }}
          />
        </>
      ) : user?.role === "garageOwner" ? (
        <>
          <Stack.Screen name="GarageOwnerTabs" component={GarageOwnerTabs} />
          <Stack.Screen
            name="UserManagement"
            component={UserManagementScreen}
            options={{
              headerShown: true,
              title: "Garage Staff",
              headerStyle: { backgroundColor: "#4CAF50" },
              headerTintColor: "#fff",
            }}
          />
          <Stack.Screen
            name="NotificationsManager"
            component={NotificationsManager}
            options={{
              headerShown: true,
              title: "Manage Notifications",
              headerStyle: { backgroundColor: "#4CAF50" },
              headerTintColor: "#fff",
            }}
          />
          <Stack.Screen
            name="GarageProfile"
            component={GarageProfile}
            options={{
              headerShown: true,
              title: "Profile",
              headerStyle: { backgroundColor: "#4CAF50" },
              headerTintColor: "#fff",
            }}
          />
          <Stack.Screen
            name="GarageReports"
            component={GarageReportsScreen}
            options={{
              headerShown: true,
              title: "Reports & Analytics",
              headerStyle: { backgroundColor: "#4CAF50" },
              headerTintColor: "#fff",
            }}
          />
        </>
      ) : (
        // Default to user tabs
        <>
          <Stack.Screen name="UserTabs" component={UserTabs} />
          <Stack.Screen
            name="StaffProfile"
            component={StaffProfile}
            options={{
              headerShown: true,
              title: " Garage Profile",
              headerStyle: { backgroundColor: "#4CAF50" },
              headerTintColor: "#fff",
            }}
          />
        </>
      )}
      <Stack.Screen
        name="Profile"
        component={Profile}
        options={{
          headerShown: true,
          title: "Profile",
          headerStyle: { backgroundColor: "#4CAF50" },
          headerTintColor: "#fff",
        }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePassword}
        options={{
          headerShown: true,
          title: "Change Password",
          headerStyle: { backgroundColor: "#4CAF50" },
          headerTintColor: "#fff",
        }}
      />
      <Stack.Screen
        name="SwitchMode"
        component={SwitchMode}
        options={{
          headerShown: true,
          title: "Switch Mode",
          headerStyle: { backgroundColor: "#4CAF50" },
          headerTintColor: "#fff",
        }}
      />
      <Stack.Screen
        name="Help"
        component={Help}
        options={{
          headerShown: true,
          title: "Help & Support",
          headerStyle: { backgroundColor: "#4CAF50" },
          headerTintColor: "#fff",
        }}
      />
      <Stack.Screen
        name="Language"
        component={Language}
        options={{
          headerShown: true,
          title: "Language",
          headerStyle: { backgroundColor: "#4CAF50" },
          headerTintColor: "#fff",
        }}
      />
      <Stack.Screen
        name="Privacy"
        component={Privacy}
        options={{
          headerShown: true,
          title: "Privacy Policy",
          headerStyle: { backgroundColor: "#4CAF50" },
          headerTintColor: "#fff",
        }}
      />
      <Stack.Screen
        name="driverLocation"
        component={DriverLocation}
        options={{
          headerShown: true,
          title: "Driver Location",

          headerStyle: { backgroundColor: "#4CAF50" },
          headerTintColor: "#fff",
        }}
      />
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
