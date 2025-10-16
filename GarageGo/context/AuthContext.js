import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AuthService from "../services/AuthService";
import { Alert } from "react-native";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize user and token from AsyncStorage on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        const storedUser = await AsyncStorage.getItem("user");

        if (storedToken) setToken(storedToken);
        if (storedUser) setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };
    initializeAuth();
  }, []);

  /**
   * FIX: This function now accepts the final 'response' object (which contains token and user data)
   * directly from the Login screen, bypassing the need for a second AuthService network call.
   */
  const login = async (response) => {
    setIsLoading(true);
    try {
      // Validate the passed response object
      if (!response || !response.token || !response._id) {
        // This is the source of the persistent "[Error: Invalid credentials]" log
        throw new Error("Invalid credentials or missing required user data.");
      }

      const { token, ...userData } = response;

      setToken(token);
      setUser(userData);

      // Safely store in AsyncStorage
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("user", JSON.stringify(userData));

      console.log(
        "[AuthContext] Session successfully set for user:",
        userData._id
      );

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      // Removed the original Alert.alert to let the Login screen handle true errors
      throw error; // Re-throw so the Login screen's try/catch can handle it
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updatedUserData) => {
    if (!updatedUserData) return; // prevent storing undefined
    try {
      setUser(updatedUserData);
      await AsyncStorage.setItem("user", JSON.stringify(updatedUserData));
    } catch (error) {
      console.error("Error updating user data:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, updateUser, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access
export const useAuth = () => useContext(AuthContext);
