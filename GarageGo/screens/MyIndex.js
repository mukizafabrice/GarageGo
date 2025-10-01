import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
// In a real mobile app, use the official community package:
import AsyncStorage from "@react-native-async-storage/async-storage";

// NOTE: In a real React Native environment, you would import icons from a dedicated library
// like 'react-native-vector-icons' or using React Native SVG.

// --- Icon Placeholders (Simulating react-native-vector-icons) ---
const IconPlaceholder = ({ name, size, color }) => (
  <Text style={{ fontSize: size, color: color, lineHeight: size * 1.2 }}>
    {name === "user" && "👤"}
    {name === "phone" && "📞"}
    {name === "check" && "✅"}
    {name === "error" && "❌"}
  </Text>
);

const User = (props) => <IconPlaceholder name="user" {...props} />;
const Phone = (props) => <IconPlaceholder name="phone" {...props} />;
const CheckCircle = (props) => <IconPlaceholder name="check" {...props} />;
const XCircle = (props) => <IconPlaceholder name="error" {...props} />;

// --- CONSTANTS ---
const PRIMARY_COLOR = "#4CAF50"; // Green brand color
const SECONDARY_TEXT_COLOR = "#757575";
const DANGER_COLOR = "#D32F2F";
const STORAGE_KEY_NAME = "user_registration_name";
const STORAGE_KEY_PHONE = "user_registration_phone";

// --- STYLESHEET (Idiomatic React Native styling) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    padding: 30,
    backgroundColor: "white",
    borderRadius: 20,
    // iOS Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    // Android Elevation
    elevation: 10,
  },
  headerText: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
    color: "#333",
    textAlign: "center",
  },
  subtitleText: {
    fontSize: 14,
    color: SECONDARY_TEXT_COLOR,
    marginBottom: 24,
    textAlign: "center",
  },
  messageBox: (isError) => ({
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: isError ? "#FEECEB" : "#EDF7ED",
  }),
  messageText: (isError) => ({
    fontSize: 14,
    fontWeight: "600",
    color: isError ? DANGER_COLOR : PRIMARY_COLOR,
    marginLeft: 10,
  }),
  inputContainer: (isDisabled) => ({
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: isDisabled ? "#E0E0E0" : "#C0C0C0",
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: isDisabled ? "#FAFAFA" : "white",
    height: 54,
  }),
  iconWrapper: {
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  input: (isDisabled) => ({
    flex: 1,
    fontSize: 16,
    color: isDisabled ? SECONDARY_TEXT_COLOR : "#333",
    paddingHorizontal: 10,
  }),
  button: (color) => ({
    backgroundColor: color,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  }),
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F9FC",
  },
});

// Custom Hook to manage state and AsyncStorage
const useRegistrationData = () => {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [message, setMessage] = useState("");
  const [hasSavedData, setHasSavedData] = useState(false);

  // Load data from AsyncStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedName = await AsyncStorage.getItem(STORAGE_KEY_NAME);
        const storedPhone = await AsyncStorage.getItem(STORAGE_KEY_PHONE);

        if (storedName && storedPhone) {
          setName(storedName);
          setPhoneNumber(storedPhone);
          setHasSavedData(true);
          console.log("[App Logic] Saved data found. Ready to navigate.");
        } else {
          setHasSavedData(false);
          setMessage("Enter your name and phone number to get started.");
          console.log(
            "[App Logic] No saved data found. Showing registration form."
          );
        }
      } catch (error) {
        // In a real app, this is where you'd handle AsyncStorage failure (rare)
        console.error("Error loading data from AsyncStorage:", error);
        setMessage("Error loading saved data.");
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  // Save data to AsyncStorage
  const saveData = useCallback(
    async (onSaveSuccess) => {
      if (!name.trim() || !phoneNumber.trim()) {
        setMessage("Name and Phone Number are required.");
        return false;
      }

      try {
        await AsyncStorage.setItem(STORAGE_KEY_NAME, name.trim());
        await AsyncStorage.setItem(STORAGE_KEY_PHONE, phoneNumber.trim());
        setMessage("Data saved successfully!");
        setHasSavedData(true);
        setIsEditing(false);

        if (onSaveSuccess) {
          onSaveSuccess(name.trim());
        }
        return true;
      } catch (error) {
        console.error("Error saving data to AsyncStorage:", error);
        setMessage("Error saving data.");
        return false;
      }
    },
    [name, phoneNumber]
  );

  return {
    name,
    setName,
    phoneNumber,
    setPhoneNumber,
    isLoaded,
    isEditing,
    setIsEditing,
    message,
    setMessage,
    saveData,
    hasSavedData,
  };
};

// --- Custom Input Component (RN Style) ---
const InputField = ({
  label,
  icon: Icon,
  value,
  onChangeText,
  placeholder,
  disabled = false,
  type = "default",
}) => (
  <View style={{ marginBottom: 20 }}>
    <Text
      style={{
        fontSize: 13,
        fontWeight: "500",
        marginBottom: 6,
        color: disabled ? SECONDARY_TEXT_COLOR : "#333",
      }}
    >
      {label}
    </Text>
    <View style={styles.inputContainer(disabled)}>
      <View style={styles.iconWrapper}>
        <Icon
          size={20}
          color={disabled ? SECONDARY_TEXT_COLOR : PRIMARY_COLOR}
        />
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        editable={!disabled}
        keyboardType={type === "tel" ? "phone-pad" : "default"}
        style={styles.input(disabled)}
        placeholderTextColor={disabled ? SECONDARY_TEXT_COLOR : "#A0A0A0"}
      />
    </View>
  </View>
);

// --- The Actual Registration Form Component with Keyboard Handling ---
const UserDetailForm = ({ data, navigation }) => {
  const {
    name,
    setName,
    phoneNumber,
    setPhoneNumber,
    isEditing,
    setMessage,
    saveData,
    message, // <-- FIXED: Added 'message' here
  } = data;

  const handleSubmit = async () => {
    setMessage("");
    await saveData((savedName) => {
      // Navigate/replace to LandingPage on successful save
      navigation.replace("LandingPage", { userName: savedName });
    });
  };

  const isError = message.includes("required") || message.includes("Error");
  const isSuccess = message.includes("success") || message.includes("Welcome");

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* Header */}
          <Text style={styles.headerText}>Welcome to GarageGo!</Text>
          <Text style={styles.subtitleText}>
            This is a one-time setup. Let's save your details securely.
          </Text>

          {/* Status Message */}
          {message ? (
            <View style={styles.messageBox(isError)}>
              {isSuccess ? (
                <CheckCircle size={20} color={PRIMARY_COLOR} />
              ) : (
                <XCircle size={20} color={DANGER_COLOR} />
              )}
              <Text style={styles.messageText(isError)}>{message}</Text>
            </View>
          ) : null}

          {/* Form / Display Area */}
          <View>
            <InputField
              label="Full Name"
              icon={User}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Jane Doe"
              disabled={!isEditing}
            />
            <InputField
              label="Phone Number"
              icon={Phone}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="e.g., +250781111111"
              type="tel"
              disabled={!isEditing}
            />

            <TouchableOpacity
              onPress={handleSubmit}
              style={styles.button(PRIMARY_COLOR)}
            >
              <Text style={styles.buttonText}>Save Details & Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// --- Main Application Entry Point (Handles Navigation) ---
const RegistrationScreen = ({ navigation }) => {
  const data = useRegistrationData();
  const { isLoaded, hasSavedData, name } = data;

  // Use a state to control the momentary redirecting message
  const [isNavigating, setIsNavigating] = useState(false);

  // Handles automatic navigation skip on load
  useEffect(() => {
    if (isLoaded && hasSavedData) {
      console.log("[Navigation] Data found, auto-skipping to LandingPage.");
      setIsNavigating(true);

      // Navigate after a small delay for better UX
      setTimeout(() => {
        // IMPORTANT: Pass the name in params for the LandingPage to display
        navigation.replace("LandingPage", { userName: name });
      }, 300);
    }
  }, [isLoaded, hasSavedData, name, navigation]);

  if (!isLoaded || isNavigating) {
    // Show loading screen while checking AsyncStorage or redirecting
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text
          style={{ marginTop: 16, fontSize: 16, color: SECONDARY_TEXT_COLOR }}
        >
          {isNavigating
            ? "Redirecting to main screen..."
            : "Checking for saved details..."}
        </Text>
      </View>
    );
  }

  // Condition: Data does not exist, show RegistrationForm
  return <UserDetailForm data={data} navigation={navigation} />;
};

export default RegistrationScreen;
