import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import LandingPage from "../screens/LandingPage";
import Login from "../screens/Login";

const Stack = createStackNavigator();

const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="LandingPage" component={LandingPage} />
    <Stack.Screen name="Login" component={Login} />
  </Stack.Navigator>
);

export default AuthNavigator;
