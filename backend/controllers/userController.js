// controllers/userController.js
import User from "../models/User.js";
import Garage from "../models/Garage.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

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
    // We accept fcmToken and garageId, but only use them for specific roles.
    const { email, password, fcmToken, garageId } = req.body;

    // 1. Authenticate User (MANDATORY FOR ALL ROLES)
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // --- 2. Token Registration and Authorization Check (FOR GARAGE STAFF/OWNERS ONLY) ---
    const isGarageStaffOrOwner =
      user.role === "garageOwner" || user.role === "user";

    // This entire block is safely skipped for 'admin' and other non-garage roles.
    if (isGarageStaffOrOwner && fcmToken && garageId) {
      // Find the Garage document and verify the user (staff or owner) is associated with it.
      const garage = await Garage.findOne({
        _id: garageId,
        userId: user._id, // Ensures the user's ID is in the Garage's 'userId' array
      });

      if (!garage) {
        // This means the garageId is invalid OR the user is not associated with that garage.
        return res.status(401).json({
          message:
            "Authorization failed: Garage ID is incorrect or user is not a registered staff/owner of this garage.",
        });
      }

      // Add FCM token to garage's token array (for multiple devices)
      await Garage.updateOne(
        { _id: garageId },
        { $addToSet: { fcmToken: fcmToken } } // Add to array without duplicates
      );

      console.log(`✅ Added FCM token to garage ${garageId} for user ${user._id} (role: ${user.role})`);
      console.log(`📱 FCM Token: ${fcmToken}`);
    }

    // 4. Generate and Return JWT (MANDATORY FOR ALL ROLES)
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET
    );

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
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

export const registerUserAndAssignGarage = async (req, res) => {
  const { name, email, garageId } = req.body;
  const defaultPassword = "123";
  const fixedRole = "user";
  try {
    if (!name || !email || !garageId) {
      return res.status(400).json({
        message: "Please provide name, email, and the target garageId.",
      });
    }
    console.log("Checking if user exists...");
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "User with this email already exists." });
    }
    console.log("Finding garage:", garageId);
    const garage = await Garage.findById(garageId);
    if (!garage) {
      return res
        .status(404)
        .json({ message: "Garage not found. Cannot assign user." });
    }
    console.log("Hashing password...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);
    console.log("Creating user...");
    const createdUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: fixedRole,
    });
    console.log("Updating garage...");
    const updatedGarage = await Garage.findByIdAndUpdate(
      garageId,
      { $push: { userId: createdUser._id } },
      { new: true, runValidators: true }
    );
    res.status(201).json({
      message: `User registered with role '${fixedRole}', default password '123', and successfully assigned to garage.`,
      user: {
        _id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
      },
      garage: {
        _id: updatedGarage._id,
        name: updatedGarage.name,
        assignedUsersCount: updatedGarage.userId.length,
      },
    });
  } catch (error) {
    console.error("Server Error:", error, error?.message, error?.stack);
    res.status(500).json({
      message: "Server error during user registration and garage assignment.",
      details: error.message,
    });
  }
};

// Update user password with current password check
export const updateUserPassword = async (req, res) => {
  const { userId } = req.params; // or req.body, depending on your route
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({
      message: "Current and new password (min 6 chars) are required.",
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Current password is incorrect." });
    }

    // Hash and update new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({
      message: "Server error updating password.",
      details: error.message,
    });
  }
};

// ✅ Secure OTP generator
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
};

// Forgot Password - generate OTP and send email
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOTP();
    user.resetPasswordToken = otp;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    user.resetPasswordVerified = false;
    await user.save();

    // Send email with OTP
    const transporter = nodemailer.createTransport({
      service: "gmail", // change to your provider
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"GarageGo" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset OTP",
      text: `Your OTP code is ${otp}. It will expire in 15 minutes.`,
    });

    res.json({ message: "OTP sent to email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Verify OTP (optional step)
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email,
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() }, // not expired
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.resetPasswordVerified = true;
    await user.save();

    res.json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({
      email,
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear reset fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.resetPasswordVerified = false;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
