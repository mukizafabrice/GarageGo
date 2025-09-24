import { axiosInstance } from "./apiConfig";

const AuthService = {
  login: async (email, password) => {
    try {
      const response = await axiosInstance.post("/user/login", {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      console.error("Login error:", error.message);
      throw new Error(
        error.response?.data?.message || "Login failed. Please try again."
      );
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await axiosInstance.post("/forgot-password", { email });
      return response.data;
    } catch (error) {
      console.error("Forgot password error:", error.message);
      throw new Error(
        error.response?.data?.message ||
          "Failed to send password reset link. Please try again."
      );
    }
  },
};

export const addUser = async (userData) => {
  const response = await axiosInstance.post("/user/register", userData);
  return response.data;
};

export const fetchUsers = async () => {
  const response = await axiosInstance.get("/user");
  return response.data;
};

// Fetch a single user by ID
export const fetchUserById = async (id) => {
  const response = await axiosInstance.get(`/user/${id}`);
  return response.data;
};

// Update a user (no password update here)
export const updateUser = async (id, updates) => {
  const response = await axiosInstance.put(`/user/${id}`, updates);
  return response.data;
};

// Delete a user
export const deleteUser = async (id) => {
  const response = await axiosInstance.delete(`/user/${id}`);
  return response.data;
};

export default AuthService;
