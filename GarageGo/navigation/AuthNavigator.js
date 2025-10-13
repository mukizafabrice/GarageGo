// AuthNavigator.js
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import Index from "../screens/MyIndex";
import LandingPage from "../screens/LandingPage";
import Login from "../screens/Login";
import ForgotPassword from "../screens/ForgotPasswordScreen";
import ResetPassword from "../screens/ResetPasswordScreen";

const Stack = createStackNavigator();

const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Index" component={Index} />
    <Stack.Screen name="LandingPage" component={LandingPage} />
    <Stack.Screen name="Login" component={Login} />
    <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
    <Stack.Screen name="ResetPassword" component={ResetPassword} />
  </Stack.Navigator>
);

export default AuthNavigator;
