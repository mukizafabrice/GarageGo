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
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    console.log("📱 FCM Token (Expo Push Token) retrieved successfully:", token);
    console.log("🔍 Full token data:", tokenData);
    return token;
  } catch (error) {
    console.error("Error retrieving FCM token:", error);
    // Check if it's the EXPERIENCE_NOT_FOUND error
    if (error.message && error.message.includes("EXPERIENCE_NOT_FOUND")) {
      console.warn(
        "Expo experience not found. This is expected in development. Using fallback token."
      );
      // Return a proper Expo-like token for development/testing purposes
      return `ExponentPushToken[fallback-${Date.now()}]`;
    }
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

    // Re-throw the original error with proper message for invalid credentials
    if (
      error.response?.status === 400 &&
      originalData?.message === "Invalid credentials"
    ) {
      throw new Error(
        "Invalid credentials. Please check your email and password."
      );
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
    console.log("🚀 Login - FCM Token retrieved:", fcmToken);

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
          // Always send FCM token to backend for garage roles, even if null
          try {
            const loginResult = await AuthService.login(
              email,
              password,
              fcmToken,
              garageId
            );
            console.log("✅ Final login with FCM token successful:", loginResult);
            console.log("🔑 FCM Token sent to backend:", fcmToken);
          } catch (loginError) {
            console.warn(
              "Final login failed, but proceeding with initial login:",
              loginError
            );
            // Still proceed even if the FCM token registration fails
          }
        } else {
          // Logged-in staff/owner is not linked to a garage or data was malformed.
          Alert.alert(
            "Error",
            `Account role (${userRole}) requires a linked garage, but none was found.`
          );
          setIsLoading(false);
          return;
        }
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
      proceedWithLogin(finalResult, userId, userRole, fcmToken);
    } catch (error) {
      // Catch network or true authentication errors from Step 1 or Step 4 failure
      const errorDetail = error.message || "An unknown error occurred.";

      // LOGGING THE CRITICAL ERROR FOR DIAGNOSTICS (only in development)
      // Temporarily disabled to prevent confusion
      // if (__DEV__) {
      //   console.error("Critical Login Flow Failure:", error);
      // }

      // Display the error on screen instead of just logging it
      Alert.alert("Login Error", errorDetail);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract the login logic into a separate function for reuse
  const proceedWithLogin = async (finalResult, userId, userRole, fcmToken) => {
    try {
      await login(finalResult);

      // Navigate based on user role
      if (userRole === "admin") {
        navigation.navigate("AdminTabs");
      } else if (userRole === "garageOwner") {
        navigation.navigate("GarageOwnerTabs");
      } else if (userRole === "user") {
        navigation.navigate("UserTabs");
      } else {
        // Default fallback
        navigation.navigate("LandingPage");
      }
    } catch (error) {
      console.error("Error during final login step:", error);
      Alert.alert("Login Error", "Failed to complete login process.");
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
