import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  TextInput,
  Button,
  Avatar,
  Card,
  useTheme,
  HelperText,
  Text,
} from "react-native-paper";
import { useAuth } from "../../context/AuthContext";
// NOTE: Assuming useNavigation is imported in the real component file
// import { useNavigation } from "@react-navigation/native";

// Define Brand Color
const PRIMARY_COLOR = "#4CAF50";

const UpdateProfileScreen = ({ navigation }) => {
  const { colors } = useTheme();
  // Mocking useAuth and navigation for standalone file completeness
  const mockUser = {
    name: "Alex Smith",
    email: "alex.smith@garagego.com",
    phone: "555-123-4567",
  };
  const useAuthMock = () => ({
    user: mockUser,
    updateProfile: (data) =>
      new Promise((resolve) => setTimeout(resolve, 1500)),
  });
  const { user, updateProfile } = useAuthMock();

  // Local State for Form
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [isLoading, setIsLoading] = useState(false);

  // Validation State
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const validate = () => {
    let valid = true;
    setNameError("");
    setEmailError("");
    setPhoneError("");

    if (!name.trim()) {
      setNameError("Name is required.");
      valid = false;
    }
    if (!email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
      setEmailError("Please enter a valid email address.");
      valid = false;
    }
    // Simple phone format check (optional)
    if (phone.length > 0 && !phone.match(/^\d{3}-\d{3}-\d{4}$/)) {
      setPhoneError("Format: XXX-XXX-XXXX (optional)");
    }

    return valid;
  };

  const handleUpdate = async () => {
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    const updatedData = { name, email, phone };

    try {
      // Assuming context function updates user in context/backend
      await updateProfile(updatedData);
      Alert.alert("Success", "Your profile has been updated successfully!");
      // navigation.goBack(); // Uncomment in a real app
    } catch (error) {
      Alert.alert(
        "Update Failed",
        error.message || "Could not update profile."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          variant="headlineMedium"
          style={[styles.title, { color: colors.onBackground }]}
        >
          Edit Your Profile
        </Text>

        {/* Profile Card and Avatar */}
        <Card style={[styles.profileCard, { backgroundColor: colors.surface }]}>
          <View style={styles.avatarContainer}>
            <Avatar.Icon
              size={80}
              icon="account-circle"
              style={{ backgroundColor: PRIMARY_COLOR }}
              color="#FFFFFF"
            />
            {/* Optional: Add a small button to change avatar */}
            <Button
              mode="text"
              onPress={() =>
                Alert.alert(
                  "Change Photo",
                  "Photo upload functionality coming soon."
                )
              }
              labelStyle={{ color: PRIMARY_COLOR }}
              style={styles.changePhotoButton}
            >
              Change Photo
            </Button>
          </View>

          <View style={styles.formContainer}>
            {/* Name Input */}
            <TextInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              activeOutlineColor={PRIMARY_COLOR}
              error={!!nameError}
            />
            <HelperText type="error" visible={!!nameError}>
              {nameError}
            </HelperText>

            {/* Email Input */}
            <TextInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              activeOutlineColor={PRIMARY_COLOR}
              error={!!emailError}
            />
            <HelperText type="error" visible={!!emailError}>
              {emailError}
            </HelperText>

            {/* Phone Input */}
            <TextInput
              label="Phone Number (XXX-XXX-XXXX)"
              value={phone}
              onChangeText={setPhone}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.input}
              activeOutlineColor={PRIMARY_COLOR}
              error={!!phoneError}
            />
            <HelperText type="error" visible={!!phoneError}>
              {phoneError}
            </HelperText>

            {/* Save Button */}
            <Button
              mode="contained"
              icon="content-save"
              onPress={handleUpdate}
              loading={isLoading}
              disabled={
                isLoading || !!nameError || !!emailError || !!phoneError
              }
              style={styles.saveButton}
              contentStyle={styles.saveContent}
              labelStyle={styles.saveLabel}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    marginBottom: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  profileCard: {
    borderRadius: 15,
    padding: 20,
    elevation: 4,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  changePhotoButton: {
    marginTop: 8,
  },
  formContainer: {
    width: "100%",
  },
  input: {
    marginBottom: 4, // Reduced marginBottom to account for HelperText space
  },
  saveButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 10,
    marginTop: 20,
  },
  saveContent: {
    paddingVertical: 8,
  },
  saveLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});

export default UpdateProfileScreen;
