// AuthNavigator.js
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import Index from "../screens/MyIndex";
import LandingPage from "../screens/LandingPage";
import Login from "../screens/Login";

const Stack = createStackNavigator();

const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Index" component={Index} />
    <Stack.Screen name="LandingPage" component={LandingPage} />
    <Stack.Screen name="Login" component={Login} />
  </Stack.Navigator>
);

export default AuthNavigator;
