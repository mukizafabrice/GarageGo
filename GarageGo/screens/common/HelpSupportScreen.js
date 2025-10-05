import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from "react-native";
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

const HelpSupportScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState({});

  const handlePress = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  // Mock FAQ Data
  const faqSections = [
    {
      id: "faq1",
      title: "How do I add a new vehicle?",
      content:
        'Navigate to the "Garage" tab, tap the "+" button, and enter your vehicle\'s VIN or registration details. The app will automatically fetch the make, model, and service recommendations.',
      icon: "car-plus",
    },
    {
      id: "faq2",
      title: "How do I schedule maintenance?",
      content:
        'In the "Service" tab, select the vehicle and the required service (e.g., oil change). You can then browse mechanics, view quotes, and book an appointment directly through the app.',
      icon: "calendar-check",
    },
    {
      id: "faq3",
      title: "Is my payment information secure?",
      content:
        "Yes. We use industry-leading encryption and compliance standards (PCI DSS) to ensure your payment details are tokenized and never stored on our servers.",
      icon: "credit-card-lock",
    },
    {
      id: "faq4",
      title: "Can I track my vehicle's service history?",
      content:
        'Absolutely. Every completed service booked through GarageGo is automatically logged under your vehicle\'s profile in the "History" tab, giving you a complete maintenance record.',
      icon: "history",
    },
  ];

  const handleContact = (type) => {
    if (type === "email") {
      Linking.openURL("mailto:support@garagego.com");
    } else if (type === "phone") {
      // Use a sample support number
      const phoneNumber =
        Platform.OS === "ios" ? "tel:1-800-555-0100" : "tel:18005550100";
      Linking.openURL(phoneNumber);
    }
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
        Help & Support
      </Text>

      <Card style={[styles.supportCard, { backgroundColor: colors.surface }]}>
        <Text
          variant="titleMedium"
          style={[styles.cardTitle, { color: colors.onSurface }]}
        >
          Frequently Asked Questions (FAQ)
        </Text>

        <List.Section>
          {faqSections.map((faq) => (
            <List.Accordion
              key={faq.id}
              title={faq.title}
              expanded={expanded[faq.id]}
              onPress={() => handlePress(faq.id)}
              left={(props) => (
                <List.Icon {...props} icon={faq.icon} color={PRIMARY_COLOR} />
              )}
              style={styles.accordionHeader}
              titleStyle={{ color: colors.onSurface }}
            >
              <View style={styles.accordionContent}>
                <Text
                  variant="bodyMedium"
                  style={{ color: colors.onSurfaceVariant }}
                >
                  {faq.content}
                </Text>
              </View>
            </List.Accordion>
          ))}
        </List.Section>

        <Divider style={styles.divider} />

        <Text
          variant="titleMedium"
          style={[styles.cardTitle, { color: colors.onSurface }]}
        >
          Need More Help?
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.contactText, { color: colors.onSurfaceVariant }]}
        >
          If you can't find your answer above, please contact our support team
          directly.
        </Text>

        <View style={styles.contactButtons}>
          <Button
            mode="contained"
            icon="email-outline"
            onPress={() => handleContact("email")}
            style={[styles.contactButton, styles.emailButton]}
            labelStyle={styles.contactButtonLabel}
          >
            Email Support
          </Button>

          <Button
            mode="outlined"
            icon="phone-outline"
            onPress={() => handleContact("phone")}
            style={styles.contactButton}
            labelStyle={[styles.contactButtonLabel, { color: PRIMARY_COLOR }]}
          >
            Call Hotline
          </Button>
        </View>
      </Card>

      <View style={styles.footerContainer}>
        <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
          We typically respond to emails within 24 hours.
        </Text>
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
  supportCard: {
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
    marginVertical: 20,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  accordionHeader: {
    borderRadius: 8,
    marginVertical: 2,
  },
  accordionContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY_COLOR,
    backgroundColor: "rgba(76, 175, 80, 0.05)",
    marginBottom: 5,
  },
  contactText: {
    marginBottom: 15,
    textAlign: "center",
  },
  contactButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  contactButton: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 8,
  },
  emailButton: {
    backgroundColor: PRIMARY_COLOR,
  },
  contactButtonLabel: {
    fontWeight: "bold",
    paddingVertical: 4,
    fontSize: 14,
  },
  footerContainer: {
    marginTop: 15,
    alignItems: "center",
  },
});

export default HelpSupportScreen;
