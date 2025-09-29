import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Text,
  List,
  useTheme,
  Button,
  Card,
  Divider,
} from "react-native-paper";

// Define Brand Color
const PRIMARY_COLOR = "#4CAF50";

const availableLanguages = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish (Español)" },
  { code: "fr", name: "French (Français)" },
  { code: "de", name: "German (Deutsch)" },
  { code: "pt", name: "Portuguese (Português)" },
];

const LanguageScreen = ({ navigation }) => {
  const { colors } = useTheme();

  // State to hold the currently selected language code.
  // We initialize it to 'en' (English) as a default.
  const [selectedLanguageCode, setSelectedLanguageCode] = useState("en");
  const [isLoading, setIsLoading] = useState(false);

  const handleLanguageChange = (code) => {
    setSelectedLanguageCode(code);
  };

  const handleSave = () => {
    setIsLoading(true);
    // In a real application, you would call an API or update a global state/context

    setTimeout(() => {
      setIsLoading(false);
      const selectedLang = availableLanguages.find(
        (lang) => lang.code === selectedLanguageCode
      );

      Alert.alert(
        "Language Updated",
        `Your application language has been set to ${
          selectedLang?.name || "English"
        }. (Mock Update)`,
        [
          // You might uncomment this in a real scenario to go back to settings:
          // { text: "OK", onPress: () => navigation.goBack() }
          { text: "OK" },
        ]
      );
    }, 1000);
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
        Select Language
      </Text>

      <Card style={[styles.languageCard, { backgroundColor: colors.surface }]}>
        <Text
          variant="titleMedium"
          style={[styles.cardTitle, { color: colors.onSurface }]}
        >
          Current Language Settings
        </Text>

        <Divider style={styles.divider} />

        <List.Section>
          {availableLanguages.map((lang) => (
            <List.Item
              key={lang.code}
              title={lang.name}
              onPress={() => handleLanguageChange(lang.code)}
              style={styles.listItem}
              left={(props) => (
                <List.Icon {...props} icon="translate" color={PRIMARY_COLOR} />
              )}
              right={() => (
                <View style={styles.radioContainer}>
                  <Text
                    variant="bodyMedium"
                    style={{ marginRight: 10, color: colors.onSurfaceVariant }}
                  >
                    {lang.code.toUpperCase()}
                  </Text>
                  <View
                    style={styles.radioIndicator(
                      colors,
                      lang.code === selectedLanguageCode
                    )}
                  >
                    {lang.code === selectedLanguageCode && (
                      <View style={styles.radioActiveDot(PRIMARY_COLOR)} />
                    )}
                  </View>
                </View>
              )}
            />
          ))}
        </List.Section>
      </Card>

      <View style={styles.footerContainer}>
        <Button
          mode="contained"
          icon="check-circle-outline"
          onPress={handleSave}
          loading={isLoading}
          disabled={isLoading}
          style={styles.saveButton}
          contentStyle={styles.saveContent}
          labelStyle={styles.saveLabel}
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </View>
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
    marginBottom: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  languageCard: {
    borderRadius: 15,
    padding: 15,
    elevation: 4,
  },
  cardTitle: {
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 5,
  },
  divider: {
    marginVertical: 10,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  listItem: {
    paddingHorizontal: 5,
  },
  radioContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioIndicator: (colors, isSelected) => ({
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: isSelected ? PRIMARY_COLOR : colors.outline,
    alignItems: "center",
    justifyContent: "center",
  }),
  radioActiveDot: (color) => ({
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: color,
  }),
  footerContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  saveButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 10,
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

export default LanguageScreen;
