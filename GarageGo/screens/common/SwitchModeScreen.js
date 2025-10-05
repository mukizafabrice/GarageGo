import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";
import {
  Text,
  useTheme,
  Card,
  Button,
  Divider,
  ActivityIndicator,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons"; // Using Ionicons for illustrative icons

// Define Brand Color
const PRIMARY_COLOR = "#4CAF50";

const SwitchModeScreen = ({ navigation }) => {
  const { colors } = useTheme();

  // State to track the active mode: 'customer' or 'garage'
  // In a real app, this would be fetched from a global auth/user state
  const [activeMode, setActiveMode] = useState("customer");
  const [isLoading, setIsLoading] = useState(false);

  // Mock function to simulate switching the user role/mode
  const handleSwitchMode = (mode) => {
    if (mode === activeMode) {
      Alert.alert(
        "Mode Active",
        `You are already in ${mode.toUpperCase()} mode.`
      );
      return;
    }

    setIsLoading(true);

    // Simulate API call or context switch delay
    setTimeout(() => {
      setActiveMode(mode);
      setIsLoading(false);

      const modeName =
        mode === "customer"
          ? "Customer/Vehicle Owner"
          : "Garage Owner/Service Provider";

      Alert.alert(
        "Mode Switched Successfully",
        `Your profile is now set to ${modeName} mode. The main navigation will update accordingly.`,
        [{ text: "Continue" }]
      );
      // In a real app, you would navigate away or update a global state here
      // navigation.navigate('Home', { mode: mode });
    }, 1200);
  };

  const renderModeCard = (mode, title, description, iconName) => {
    const isSelected = activeMode === mode;
    const isDisabled = isLoading && !isSelected;

    return (
      <TouchableOpacity
        key={mode}
        onPress={() => handleSwitchMode(mode)}
        disabled={isDisabled || isLoading}
        style={styles.modeTouchArea}
      >
        <Card
          style={[
            styles.modeCard,
            {
              backgroundColor: isSelected ? PRIMARY_COLOR : colors.surface,
              borderColor: isSelected ? PRIMARY_COLOR : colors.outline,
              opacity: isDisabled ? 0.6 : 1,
            },
          ]}
        >
          <View style={styles.cardContent}>
            <Ionicons
              name={iconName}
              size={50}
              color={isSelected ? colors.surface : PRIMARY_COLOR}
              style={styles.modeIcon}
            />
            <View style={styles.textContainer}>
              <Text
                variant="titleLarge"
                style={[
                  styles.modeTitle,
                  { color: isSelected ? colors.surface : colors.onSurface },
                ]}
              >
                {title}
              </Text>
              <Text
                variant="bodyMedium"
                style={{
                  color: isSelected ? colors.surface : colors.onSurfaceVariant,
                }}
              >
                {description}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text
        variant="headlineMedium"
        style={[styles.title, { color: PRIMARY_COLOR }]}
      >
        Switch Account Mode
      </Text>
      <Text
        variant="bodyMedium"
        style={[styles.subtitle, { color: colors.onSurfaceVariant }]}
      >
        Easily switch between managing your **garage business** and booking
        services as a **vehicle owner**.
      </Text>

      <Divider style={styles.topDivider} />

      {/* --- Mode Selection Cards --- */}
      <View style={styles.modeSelectionContainer}>
        {renderModeCard(
          "customer",
          "Vehicle Owner Mode",
          "Book services, manage your vehicles, and track service history.",
          "car-search-outline"
        )}

        {renderModeCard(
          "garage",
          "Garage Owner Mode",
          "Manage your business profile, services, and incoming job requests.",
          "hammer-outline" // Using hammer for tool/work
        )}
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            animating={true}
            color={PRIMARY_COLOR}
            size="large"
          />
          <Text style={{ color: PRIMARY_COLOR, marginTop: 10 }}>
            Switching to {activeMode.toUpperCase()} mode...
          </Text>
        </View>
      )}

      {/* --- Action Button --- */}
      <View style={styles.footerContainer}>
        <Button
          mode="contained"
          icon={activeMode === "customer" ? "car-multiple" : "wrench"}
          onPress={() =>
            handleSwitchMode(activeMode === "customer" ? "garage" : "customer")
          }
          loading={isLoading}
          disabled={isLoading}
          style={styles.switchButton}
          contentStyle={styles.switchContent}
          labelStyle={styles.switchLabel}
        >
          {isLoading
            ? "Processing..."
            : `Switch to ${
                activeMode === "customer" ? "Garage" : "Customer"
              } Mode`}
        </Button>
      </View>

      <Text
        variant="bodySmall"
        style={[styles.footerNote, { color: colors.onSurfaceVariant }]}
      >
        Your profile data (vehicles or garage info) remains saved regardless of
        the active mode.
      </Text>
    </ScrollView>
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
    marginBottom: 5,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 15,
    fontSize: 16,
    paddingHorizontal: 10,
  },
  topDivider: {
    marginVertical: 20,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  modeSelectionContainer: {
    marginBottom: 30,
    gap: 15, // spacing between cards
  },
  modeTouchArea: {
    borderRadius: 15,
  },
  modeCard: {
    padding: 20,
    borderRadius: 15,
    borderWidth: 3,
    elevation: 4,
    minHeight: 150,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  modeIcon: {
    marginRight: 15,
    // Add extra padding to accommodate different icon shapes
  },
  textContainer: {
    flex: 1,
  },
  modeTitle: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  loadingContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  // Footer/Button Styles
  footerContainer: {
    paddingHorizontal: 0,
    marginBottom: 15,
  },
  switchButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 10,
  },
  switchContent: {
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  footerNote: {
    textAlign: "center",
    paddingHorizontal: 10,
  },
});

export default SwitchModeScreen;
