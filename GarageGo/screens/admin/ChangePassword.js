import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import {
  TextInput,
  Button,
  Card,
  useTheme,
  HelperText,
  Text,
  IconButton,
} from "react-native-paper";
import { useAuth } from "../../context/AuthContext";
// NOTE: Assuming useNavigation is imported in the real component file
// import { useNavigation } from "@react-navigation/native";

// Define Brand Color
const PRIMARY_COLOR = "#4CAF50";

const ChangePasswordScreen = ({ navigation }) => {
  const { colors } = useTheme();

  // Mocking useAuth for standalone file completeness
  const useAuthMock = () => ({
    // In a real app, this would be an actual function interacting with Firebase/Auth service
    changePassword: (oldP, newP) =>
      new Promise((resolve, reject) => {
        setTimeout(() => {
          if (oldP === "wrongpassword") {
            reject({ message: "Incorrect current password." });
          } else {
            resolve();
          }
        }, 1500);
      }),
  });
  const { changePassword } = useAuthMock();

  // State for form fields
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // State for password visibility
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation State
  const [oldPassError, setOldPassError] = useState("");
  const [newPassError, setNewPassError] = useState("");
  const [confirmPassError, setConfirmPassError] = useState("");

  const MIN_PASSWORD_LENGTH = 8;

  const validate = () => {
    let valid = true;
    setOldPassError("");
    setNewPassError("");
    setConfirmPassError("");

    if (!oldPassword.trim()) {
      setOldPassError("Current password is required.");
      valid = false;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setNewPassError(
        `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`
      );
      valid = false;
    }
    if (newPassword !== confirmPassword) {
      setConfirmPassError("New passwords do not match.");
      valid = false;
    }

    return valid;
  };

  const handleChangePassword = async () => {
    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      await changePassword(oldPassword, newPassword);
      Alert.alert("Success", "Your password has been changed successfully!");
      // Clear fields upon success
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // navigation.goBack(); // Uncomment in a real app
    } catch (error) {
      Alert.alert(
        "Update Failed",
        error.message ||
          "Could not change password. Please check your current password."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderPasswordToggle = (isVisible, setIsVisible) => (
    <TextInput.Icon
      icon={isVisible ? "eye-off" : "eye"}
      onPress={() => setIsVisible(!isVisible)}
      color={colors.onSurfaceVariant}
    />
  );

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
          Change Password
        </Text>

        <Card
          style={[styles.passwordCard, { backgroundColor: colors.surface }]}
        >
          <View style={styles.formContainer}>
            <Text
              variant="bodyMedium"
              style={[styles.infoText, { color: colors.onSurfaceVariant }]}
            >
              Passwords must be at least {MIN_PASSWORD_LENGTH} characters long.
            </Text>

            {/* Current Password Input */}
            <TextInput
              label="Current Password"
              value={oldPassword}
              onChangeText={setOldPassword}
              mode="outlined"
              secureTextEntry={!showOldPassword}
              style={styles.input}
              activeOutlineColor={PRIMARY_COLOR}
              error={!!oldPassError}
              right={renderPasswordToggle(showOldPassword, setShowOldPassword)}
            />
            <HelperText type="error" visible={!!oldPassError}>
              {oldPassError}
            </HelperText>

            {/* New Password Input */}
            <TextInput
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              mode="outlined"
              secureTextEntry={!showNewPassword}
              style={styles.input}
              activeOutlineColor={PRIMARY_COLOR}
              error={!!newPassError}
              right={renderPasswordToggle(showNewPassword, setShowNewPassword)}
            />
            <HelperText type="error" visible={!!newPassError}>
              {newPassError}
            </HelperText>

            {/* Confirm New Password Input */}
            <TextInput
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry={!showConfirmPassword}
              style={styles.input}
              activeOutlineColor={PRIMARY_COLOR}
              error={!!confirmPassError}
              right={renderPasswordToggle(
                showConfirmPassword,
                setShowConfirmPassword
              )}
            />
            <HelperText type="error" visible={!!confirmPassError}>
              {confirmPassError}
            </HelperText>

            {/* Save Button */}
            <Button
              mode="contained"
              icon="lock-reset"
              onPress={handleChangePassword}
              loading={isLoading}
              disabled={
                isLoading ||
                !!oldPassError ||
                !!newPassError ||
                !!confirmPassError ||
                !oldPassword ||
                !newPassword ||
                !confirmPassword
              }
              style={styles.saveButton}
              contentStyle={styles.saveContent}
              labelStyle={styles.saveLabel}
            >
              {isLoading ? "Updating..." : "Update Password"}
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
  passwordCard: {
    borderRadius: 15,
    padding: 20,
    elevation: 4,
  },
  formContainer: {
    width: "100%",
  },
  infoText: {
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    marginBottom: 4,
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

export default ChangePasswordScreen;
