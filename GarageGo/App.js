import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import AppNavigator from './navigation/Navigation';
import {
  requestUserPermission,
  listenToForegroundMessages,
  handleBackgroundMessages,
  handleNotificationOpenedApp,
} from './services/notificationService';

const App = () => {
  useEffect(() => {
    const initFCM = async () => {
      const token = await requestUserPermission();
      console.log('Send this token to backend:', token);

      listenToForegroundMessages();
      handleBackgroundMessages();
      handleNotificationOpenedApp();
    };

    initFCM();
  }, []);

  return <AppNavigator />;
};

export default App;
