// controllers/userController.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerAdmin = async (req, res) => {
  try {
    const { name, email } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const password = "123"; //default password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "garageOwner",
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login admin
// @route   POST /api/admin/login
// @access  Public
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
      error: error.message,
    });
  }
};

// @desc    Update user (everything EXCEPT password)
// @route   PUT /api/users/:id
// @access  Admin
export const updateUser = async (req, res) => {
  try {
    const { password, ...updates } = req.body; // exclude password

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message,
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
};

import Garage from "../models/Garage.js";
// -----------------------------------------------------------------------

/**
 * @desc Registers a new User (role fixed as 'user') and
 * assigns them to a specific Garage document by extending the userId array.
 * The user's password is set to the default '123'.
 * @route POST /api/users/register-and-assign
 * @access Public (or protected if only admins can assign users)
 */
export const registerUserAndAssignGarage = async (req, res) => {
  // Destructure required fields from the request body.
  // 'password' and 'role' are no longer expected in the body.
  const { name, email, garageId } = req.body; // <<< ROLE REMOVED FROM DESTRUCTURING

  // Define the default password as requested
  const defaultPassword = "123";

  // Define the fixed role as requested
  const fixedRole = "user"; // <<< FIXED ROLE ASSIGNED LOCALLY

  try {
    // 1. Validate Input (removed password from required checks)
    if (!name || !email || !garageId) {
      return res.status(400).json({
        message: "Please provide name, email, and the target garageId.",
      });
    }

    // 2. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "User with this email already exists." });
    }

    // 3. Find the Garage to ensure it exists before creating the User
    const garage = await Garage.findById(garageId);
    if (!garage) {
      return res
        .status(404)
        .json({ message: "Garage not found. Cannot assign user." });
    }

    // 4. Hash the Default Password
    const salt = await bcrypt.genSalt(10);
    // Use the defaultPassword for hashing
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    // 5. Create the new User document
    const createdUser = await User.create({
      name,
      email,
      password: hashedPassword, // Use the hashed default password
      role: fixedRole, // <<< HARDCODED 'user' ROLE
    });

    // 6. Extend the Garage's userId array with the new User's ID
    // We use $push to atomically add the new user's ID to the array.
    const updatedGarage = await Garage.findByIdAndUpdate(
      garageId,
      { $push: { userId: createdUser._id } },
      { new: true, runValidators: true } // {new: true} returns the updated document
    );

    // 7. Respond with success
    res.status(201).json({
      message: `User registered with role '${fixedRole}', default password '123', and successfully assigned to garage.`,
      user: {
        _id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
      },
      // You may want to return the updated garage details as well
      garage: {
        _id: updatedGarage._id,
        name: updatedGarage.name,
        // Optionally omit the large userId array if not needed in the response
        assignedUsersCount: updatedGarage.userId.length,
      },
    });
  } catch (error) {
    // Handle validation, database, or server errors
    console.error("Server Error:", error);
    res.status(500).json({
      message: "Server error during user registration and garage assignment.",
      details: error.message,
    });
  }
};
