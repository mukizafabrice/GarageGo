// routes/userRoutes.js
import express from "express";
import {
  registerAdmin,
  loginAdmin,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";

const router = express.Router();
// Admin registration
router.post("/register", registerAdmin);
// Admin login
router.post("/login", loginAdmin);
router.get("/", getUsers);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Admin
router.get("/:id", getUserById);

// @route   PUT /api/users/:id
// @desc    Update user (excluding password)
// @access  Admin
router.put("/:id", updateUser);

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Admin
router.delete("/:id", deleteUser);

export default router;
