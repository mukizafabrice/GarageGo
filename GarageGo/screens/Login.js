import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator, // Added for loading state
} from "react-native";
import * as Notifications from "expo-notifications"; // Replaced Firebase Messaging with Expo Notifications
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import AuthService from "../services/AuthService";
import { getGarageByUserId } from "../services/garageService"; // Used for fetching garage ID

// Set up the notifications handler for foreground notifications (optional but good practice)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Function to get the real FCM Token using Expo Notifications
const getFCMToken = async () => {
  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn(
        "Failed to get push token! Notifications permission denied."
      );
      return null;
    }

    // Get the Expo Push Token (which acts as the device token for Expo)
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("FCM Token (Expo Push Token) retrieved successfully:", token);
    return token;
  } catch (error) {
    console.error("Error retrieving FCM token:", error);
    return null;
  }
};

// --- FIX: Robust Login Wrapper for Non-Standard Server Responses ---
const attemptLogin = async (email, password) => {
  try {
    // Assume the initial login only sends credentials
    const result = await AuthService.login(email, password, null, null);

    // If the service succeeded (no internal throw), return the result.
    if (result && result.token) {
      return result;
    }
    // This handles standard success responses
    throw new Error("Login failed: Missing token in response.");
  } catch (error) {
    // This attempts to extract the successful data even if the service function threw a 400 error.
    // The service throws an 'Error' which may contain the original response data.
    const originalData = error.response?.data || error.data;

    // Check if the thrown error contained successful login data.
    if (originalData && originalData.token && originalData._id) {
      console.warn(
        "Non-Standard Server Response: Login succeeded despite HTTP status error. Data recovered."
      );
      return originalData; // Return the successfully recovered data
    }

    // Re-throw the original error if no successful data was found.
    throw error;
  }
};
// -----------------------------------------------------------------

const CustomButton = ({
  onPress,
  title,
  style,
  labelStyle,
  loading,
  disabled,
}) => (
  <TouchableOpacity
    style={[styles.loginButton, style, disabled && styles.disabledButton]}
    onPress={onPress}
    disabled={disabled}
  >
    {loading ? (
      <ActivityIndicator color="#fff" />
    ) : (
      <Text style={[styles.buttonLabel, labelStyle]}>{title}</Text>
    )}
  </TouchableOpacity>
);

const Login = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth(); // Context function to set user/token locally

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Validation", "Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    // --- Retrieve real FCM Token ---
    const fcmToken = await getFCMToken();

    try {
      // --- Step 1: Initial Login & Authentication (Always needed) ---
      // USE THE ROBUST WRAPPER HERE to prevent the main thread from catching a non-standard 400
      const initialResult = await attemptLogin(email, password);

      const userId = initialResult._id;
      const userRole = initialResult.role;
      // finalResult is guaranteed to hold the initial, valid session token data.
      let finalResult = initialResult;

      // Check if the user is a role that requires a linked garage
      if (userRole === "garageOwner" || userRole === "user") {
        // Check if token retrieval failed for garage-dependent roles
        if (!fcmToken) {
          Alert.alert(
            "Token Error",
            "Could not retrieve device token. This is required for push notifications. Please check app permissions or network."
          );
          setIsLoading(false);
          return;
        }

        // --- Step 2: Fetch Garage ID ---
        const garageResponse = await getGarageByUserId(userId);
        console.log("Fetched garage response:", garageResponse);

        if (
          garageResponse &&
          garageResponse.success &&
          garageResponse.data &&
          garageResponse.data._id
        ) {
          const garageId = garageResponse.data._id;

          // --- Step 3: Final Login (Token Registration on Backend) ---
          // ULTRA-AGGRESSIVE ISOLATION FIX: Wrap in setTimeout(0) to execute on the next tick,
          // completely detaching it from the current thread's try/catch block.
          setTimeout(() => {
            AuthService.login(email, password, fcmToken, garageId)
              .then(() => {
                // Success: Log the success internally, but don't block the main thread.
                console.log(
                  "FCM Token update request sent successfully (ULTRA ISOLATED)."
                );
              })
              .catch((updateError) => {
                // Failure: Log the full error for debugging and show a non-critical alert.
                console.warn(
                  "FCM Token update request failed silently (ULTRA ISOLATED). Error:",
                  updateError.message || "Unknown error during token update."
                );
                // Only alert if it's a critical push feature
                Alert.alert(
                  "Token Update Warning",
                  "Successfully logged in, but the push notification registration failed. Notifications may not work."
                );
              });
          }, 0); // Execute on the next event loop tick
        } else {
          // Logged-in staff/owner is not linked to a garage or data was malformed.
          Alert.alert(
            "Error",
            `Account role (${userRole}) requires a linked garage, but none was found.`
          );
          setIsLoading(false);
          return;
        }

        // The application execution proceeds immediately from here, without awaiting the result of Step 3.
      }

      // --- Step 4: Finalize Login (for all roles) ---
      // finalResult is guaranteed to hold the initial, valid session token data.

      // AGGRESSIVE DEBUGGING: Log the FULL DATA STRUCTURE before calling the login context function.
      console.log(
        "Attempting final session login with full data:",
        finalResult
      );

      // MANDATORY FIX: The context's login function must be changed to accept the full response object,
      // not just email and password.
      login(finalResult);
    } catch (error) {
      // Catch network or true authentication errors from Step 1 or Step 4 failure
      const errorDetail = error.message || "An unknown error occurred.";

      // LOGGING THE CRITICAL ERROR FOR DIAGNOSTICS
      console.error("Critical Login Flow Failure:", error);

      Alert.alert("Login Error", errorDetail);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      "Password Reset",
      "A password reset link has been sent to your email."
    );
  };

  const getPasswordIcon = () => (showPassword ? "🙈" : "👁️");

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#E8F5E9" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Welcome Back!</Text>

          <View style={styles.card}>
            {/* Email Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.icon}>✉️</Text>
              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.icon}>🔑</Text>
              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={styles.input}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.passwordIcon}
              >
                <Text>{getPasswordIcon()}</Text>
              </TouchableOpacity>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={() => navigation.navigate("ForgotPassword")}
              style={styles.forgotPasswordLink}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <CustomButton
              title="Login"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Login;

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#E8F5E9",
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 20,
    left: 20,
  },
  backText: {
    fontSize: 16,
    color: "#388E3C",
    fontWeight: "600",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#388E3C",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  icon: { fontSize: 20, marginRight: 10 },
  input: { flex: 1, height: 50 },
  passwordIcon: { padding: 5 },
  forgotPasswordLink: { alignSelf: "flex-end", marginBottom: 25 },
  forgotPasswordText: { color: "#5C6BC0", fontSize: 14, fontWeight: "500" },
  loginButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 45, // Ensure minimum height for loading indicator
  },
  disabledButton: {
    backgroundColor: "#A5D6A7", // Lighter green when disabled
  },
  buttonLabel: { fontSize: 18, fontWeight: "bold", color: "#fff" },
});
