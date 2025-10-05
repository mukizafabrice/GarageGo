import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Platform } from "react-native";
import { Text, List, useTheme, Divider, Card } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

// Define Brand Color
const PRIMARY_COLOR = "#4CAF50";

const PrivacyPolicyScreen = () => {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState({});

  const handlePress = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  // Mock Privacy Policy Content structured for List.Accordion
  const policySections = [
    {
      id: "data",
      title: "1. Data Collection & Use",
      icon: "database",
      content:
        "We collect information you provide directly to us, such as your name, email, vehicle information (make, model, VIN), and service history when you register or use our services. We use this data to provide, maintain, and improve our services, process transactions, and send you related information.",
    },
    {
      id: "sharing",
      title: "2. Data Sharing & Disclosure",
      icon: "share-variant",
      content:
        "We do not share your personal data with third parties except to facilitate maintenance services (e.g., sharing vehicle details with a selected mechanic), comply with legal obligations, or protect the rights and safety of GarageGo and its users. All third parties are bound by strict confidentiality agreements.",
    },
    {
      id: "security",
      title: "3. Data Security",
      icon: "shield-lock",
      content:
        "We implement industry-standard security measures, including encryption and secure server protocols, to protect your personal information from unauthorized access, alteration, disclosure, or destruction. However, no internet transmission is 100% secure.",
    },
    {
      id: "changes",
      title: "4. Policy Changes",
      icon: "file-document-edit",
      content:
        'We may update this policy periodically. We will notify you of any significant changes by posting the new policy on this page and updating the "Last Updated" date at the top of the screen. Your continued use of the app after changes constitutes acceptance of the new terms.',
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text
        variant="headlineMedium"
        style={[styles.title, { color: PRIMARY_COLOR }]}
      >
        Privacy Policy
      </Text>
      <Text variant="bodySmall" style={styles.updateText}>
        Last Updated: September 29, 2025
      </Text>

      <Card style={[styles.policyCard, { backgroundColor: colors.surface }]}>
        <Text
          variant="bodyMedium"
          style={[styles.introduction, { color: colors.onSurface }]}
        >
          Your privacy is important to GarageGo. This policy explains how we
          collect, use, and protect your information when you use our car
          maintenance and service application.
        </Text>

        <Divider style={styles.divider} />

        <List.Section
          title="Policy Details"
          titleStyle={styles.sectionTitleStyle}
        >
          {policySections.map((section) => (
            <List.Accordion
              key={section.id}
              title={section.title}
              expanded={expanded[section.id]}
              onPress={() => handlePress(section.id)}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon={section.icon}
                  color={PRIMARY_COLOR}
                />
              )}
              style={[
                styles.accordionHeader,
                { backgroundColor: colors.surface },
              ]}
              titleStyle={{ color: colors.onSurface }}
            >
              <View style={styles.accordionContent}>
                <Text
                  variant="bodyMedium"
                  style={{ color: colors.onSurfaceVariant }}
                >
                  {section.content}
                </Text>
              </View>
            </List.Accordion>
          ))}
        </List.Section>

        <Divider style={styles.divider} />

        <Text
          variant="bodyMedium"
          style={[styles.contactInfo, { color: colors.onSurfaceVariant }]}
        >
          If you have any questions about this Privacy Policy, please contact us
          at: **support@garagego.com**
        </Text>
      </Card>
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
  updateText: {
    textAlign: "center",
    marginBottom: 20,
    color: "#9E9E9E", // Gray color for date
  },
  policyCard: {
    borderRadius: 15,
    padding: 15,
    elevation: 4,
  },
  introduction: {
    marginVertical: 10,
    lineHeight: 22,
  },
  divider: {
    marginVertical: 15,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  sectionTitleStyle: {
    fontWeight: "bold",
    fontSize: 16,
    color: PRIMARY_COLOR,
    marginBottom: 10,
  },
  accordionHeader: {
    borderRadius: 8,
    marginVertical: 4,
  },
  accordionContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY_COLOR,
    backgroundColor: "rgba(76, 175, 80, 0.05)", // Light green background
    marginBottom: 8,
  },
  contactInfo: {
    marginTop: 10,
    textAlign: "center",
    fontWeight: "500",
  },
});

export default PrivacyPolicyScreen;
