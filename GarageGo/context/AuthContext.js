import React, { createContext, useContext, useState, useEffect } from "react";

// Create the context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null = not logged in
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading stored user (replace with AsyncStorage or API call)
    const loadUser = async () => {
      try {
        // Example: const storedUser = await AsyncStorage.getItem('user');
        const storedUser = null;
        if (storedUser) setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Error loading user:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the context
export const useAuth = () => useContext(AuthContext);
