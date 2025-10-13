// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
    },
    role: {
      type: String,
      enum: ["admin", "user", "garageOwner"],
      default: "garageOwner",
    },
    resetPasswordToken: {
      type: String, // store OTP as string (numeric but easier to handle as string)
      required: false,
    },
    resetPasswordExpires: {
      type: Date, // expiry time
      required: false,
    },
    resetPasswordVerified: {
      type: Boolean, // optional: mark OTP as used
      default: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
