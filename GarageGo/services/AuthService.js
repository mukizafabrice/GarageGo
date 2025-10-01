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
export const registerUserAndAssignGarageService = async (
  name,
  email,
  garageId
) => {
  if (!name || !email || !garageId) {
    throw new Error("Name, email, and garageId are required for registration.");
  }

  // Construct the payload as expected by the Express controller
  const userData = { name, email, garageId };

  // Use the relative path defined in your routes (e.g., /users/register-and-assign)
  // Note: The specific path depends on your axios base URL configuration.
  const response = await axiosInstance.post(
    `/users/register-and-assign`,
    userData
  );

  return response.data;
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
