import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import { Appbar, Card, Button, Modal, Portal } from "react-native-paper";
import MapView, { Marker } from "react-native-maps";
import * as Notifications from "expo-notifications";
import {
  getAuth,
  signInWithCustomToken,
  onAuthStateChanged,
  signInAnonymously,
} from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import app from "../../firebaseConfig";

// Notification handler for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const initialAuthToken =
  typeof __initial_auth_token !== "undefined" ? __initial_auth_token : null;

const db = getFirestore(app);
const auth = getAuth(app);
const appId = app.options.projectId;

const NotificationModal = ({
  visible,
  onAccept,
  onDecline,
  notificationData,
}) => (
  <Portal>
    <Modal
      visible={visible}
      onDismiss={onDecline}
      contentContainerStyle={styles.modalContent}
    >
      <Card>
        <Card.Title
          title="New Assistance Request!"
          subtitle="A driver near you needs help."
        />
        <Card.Content>
          <Text>
            Do you want to accept this request and see the driver's location?
          </Text>
        </Card.Content>
        <Card.Actions style={styles.modalActions}>
          <Button onPress={onDecline} mode="outlined">
            Decline
          </Button>
          <Button onPress={() => onAccept(notificationData)} mode="contained">
            Accept
          </Button>
        </Card.Actions>
      </Card>
    </Modal>
  </Portal>
);

const GarageMainScreen = () => {
  const [garage, setGarage] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [driverLocation, setDriverLocation] = useState(null);
  const [notificationData, setNotificationData] = useState(null);

  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    if (!auth || !db) {
      console.error("Firebase is not initialized.");
      setIsLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          const garageDocRef = doc(
            db,
            "artifacts",
            appId,
            "users",
            user.uid,
            "garages",
            user.uid
          );
          const garageDocSnap = await getDoc(garageDocRef);
          if (garageDocSnap.exists()) {
            setGarage(garageDocSnap.data());
          } else {
            setGarage(null);
          }
        } catch (error) {
          console.error("Error fetching garage data:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        try {
          if (initialAuthToken)
            await signInWithCustomToken(auth, initialAuthToken);
          else await signInAnonymously(auth);
        } catch (error) {
          console.error("Firebase auth error:", error);
          setIsLoading(false);
        }
      }
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotificationData(notification.request.content.data);
        setModalVisible(true);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const driverLat = parseFloat(
          response.notification.request.content.data.driverLat
        );
        const driverLng = parseFloat(
          response.notification.request.content.data.driverLng
        );
        setDriverLocation({ latitude: driverLat, longitude: driverLng });
        setModalVisible(false);
      });

    return () => {
      unsubscribeAuth();
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  const handleAcceptRequest = (data) => {
    if (data) {
      const driverLat = parseFloat(data.driverLat);
      const driverLng = parseFloat(data.driverLng);
      setDriverLocation({ latitude: driverLat, longitude: driverLng });
      setModalVisible(false);
    }
  };

  const handleDeclineRequest = () => {
    setModalVisible(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appBar}>
        <Appbar.Content
          title={garage ? garage.name : "Garage Dashboard"}
          titleStyle={styles.appBarTitle}
        />
      </Appbar.Header>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: garage?.latitude || 0,
            longitude: garage?.longitude || 0,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {garage && (
            <Marker
              coordinate={{
                latitude: garage.latitude,
                longitude: garage.longitude,
              }}
              title={garage.name}
              pinColor="blue"
            />
          )}
          {driverLocation && (
            <Marker
              coordinate={driverLocation}
              title="Driver Location"
              description="Assistance Requested Here"
              pinColor="red"
            />
          )}
        </MapView>
      </View>

      <View style={styles.infoCard}>
        <Card style={styles.card}>
          <Card.Content>
            {driverLocation ? (
              <View>
                <Text style={styles.cardText}>Driver Location:</Text>
                <Text>
                  Lat: {driverLocation.latitude.toFixed(6)}, Lng:{" "}
                  {driverLocation.longitude.toFixed(6)}
                </Text>
              </View>
            ) : (
              <Text style={styles.cardText}>
                Awaiting new assistance requests...
              </Text>
            )}
            <Text>Your User ID: {userId}</Text>
          </Card.Content>
        </Card>
      </View>

      <NotificationModal
        visible={modalVisible}
        onAccept={handleAcceptRequest}
        onDecline={handleDeclineRequest}
        notificationData={notificationData}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: { marginTop: 10, fontSize: 16, color: "#555" },
  appBar: { backgroundColor: "#4CAF50" },
  appBarTitle: { color: "#FFFFFF", fontWeight: "600" },
  mapContainer: { flex: 1, overflow: "hidden", alignSelf: "stretch" },
  map: { ...StyleSheet.absoluteFillObject },
  infoCard: { position: "absolute", bottom: 20, left: 20, right: 20 },
  card: { borderRadius: 10, elevation: 4 },
  cardText: { fontWeight: "bold", marginBottom: 5 },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 10,
  },
  modalActions: { justifyContent: "flex-end" },
});

export default GarageMainScreen;
