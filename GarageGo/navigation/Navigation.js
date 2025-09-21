// navigation/Navigation.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";

import LandingPage from "../screens/LandingPage";
import Login from "../screens/Login";
import GarageDashboard from "../screens/garage/GarageDashboard";
import AdminDashboard from "../screens/admin/AdminDashboard";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Public screen */}
        <Stack.Screen name="LandingPage" component={LandingPage} />
        <Stack.Screen name="Login" component={Login} />

        {/* Private screens */}
        <Stack.Screen name="GarageDashboard" component={GarageDashboard} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
