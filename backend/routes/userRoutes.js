// routes/userRoutes.js
import express from "express";
import {
  registerAdmin,
  loginAdmin,
  registerUserAndAssignGarage,
  getUsers,
  getUserById,
  updateUser,
  updateUserPassword,
  deleteUser,
  forgotPassword,
  verifyOtp,
  resetPassword,
} from "../controllers/userController.js";

const router = express.Router();
// Admin registration
router.post("/register", registerAdmin);
// Admin login
router.post("/login", loginAdmin);
router.post("/register-and-assign", registerUserAndAssignGarage);
router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.put("/:userId/password", updateUserPassword);
router.delete("/:id", deleteUser);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

export default router;
