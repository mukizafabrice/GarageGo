  /*
    ======================================================================================================
    ACTION REQUIRED:
    Please replace all placeholder values with your project's actual configuration from the Firebase Console.
    You can find these details in your Project settings > General.
    
    Example:
    projectId: "your-project-id"  --->  projectId: "garage-go-123456"
    ======================================================================================================
  */
  import { initializeApp, getApps, getApp } from "firebase/app";
  import { Platform } from "react-native";

  const firebaseConfig = {
    authDomain: "garagego-a3318.firebaseapp.com",
    projectId: "garagego-a3318",
    storageBucket: "garagego-a3318.firebasestorage.app",
  };

  // Platform-specific credentials
  const platformCredentials = {
    ios: {
      apiKey: "AIzaSyDEfGvroGD4rjhpPArQW--bRF_xctew1ws",
      appId: "1:850554016587:ios:d48d258500b639a19e0ece",
      messagingSenderId: "850554016587",
    },
    android: {
      apiKey: "AIzaSyB3HBeiOOeMvrtzhpCYg1H9PzJN7G6AjSA",
      appId: "1:850554016587:android:28e950d66edf76259e0ece",
      messagingSenderId: "850554016587",
    },
  };

  // Get the correct credentials based on the current platform
  const { apiKey, appId, messagingSenderId } =
    Platform.select(platformCredentials);

  // Add the platform-specific credentials to the config
  const finalConfig = {
    ...firebaseConfig,
    apiKey: apiKey,
    appId: appId,
    messagingSenderId: messagingSenderId,
  };

  // Check if a Firebase app has already been initialized.
  const app = getApps().length === 0 ? initializeApp(finalConfig) : getApp();

  export default app;
