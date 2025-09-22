import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import AdminDashboard from "../screens/admin/AdminDashboard";
import GarageDashboard from "../screens/garage/GarageDashboard";

const Stack = createStackNavigator();

const AppNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Dashboard" component={AdminDashboard} />
    <Stack.Screen name="GarageDashboard" component={GarageDashboard} />
  </Stack.Navigator>
);

export default AppNavigator;
