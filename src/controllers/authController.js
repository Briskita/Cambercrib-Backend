const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Otp = require("../models/Otp");
const PendingRegistration = require("../models/PendingRegistration");
const { createOrReplaceOtp, verifyOtpCode } = require("../utils/otp");
const { generateToken } = require("../utils/token");

const register = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, referralCode, email, password } = req.body;

    if (!firstName || !lastName || !phoneNumber || !email || !password) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists, please sign in" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await PendingRegistration.findOneAndUpdate(
      { email: normalizedEmail },
      {
        firstName,
        lastName,
        phoneNumber,
        referralCode: referralCode || null,
        email: normalizedEmail,
        password: hashedPassword,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const otp = await createOrReplaceOtp(normalizedEmail, "verify_account");

    await sendOTPEmail(normalizedEmail, otp);

    return res.status(200).json({
      message: "Registration initiated. Verify OTP to create account.",
      email: normalizedEmail,
      otp,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const resendRegistrationOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase();
    const pending = await PendingRegistration.findOne({ email: normalizedEmail });
    if (!pending) {
      return res.status(404).json({ message: "No pending registration found for this email" });
    }

    const otp = await createOrReplaceOtp(normalizedEmail, "verify_account");
    await sendOTPEmail(normalizedEmail, otp);
    return res.status(200).json({
      message: "Registration OTP resent successfully",
      email: normalizedEmail,
      otp,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const verifyRegistrationOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const normalizedEmail = email.toLowerCase();
    const verification = await verifyOtpCode(normalizedEmail, "verify_account", otp);
    if (!verification.valid) {
      return res.status(400).json({ message: verification.reason });
    }

    const pending = await PendingRegistration.findOne({ email: normalizedEmail });
    if (!pending) {
      return res.status(404).json({ message: "No pending registration found for this email" });
    }

    const user = await User.create({
      firstName: pending.firstName,
      lastName: pending.lastName,
      phoneNumber: pending.phoneNumber,
      referralCode: pending.referralCode,
      email: pending.email,
      password: pending.password,
      isVerified: true,
    });

    await Promise.all([
      Otp.deleteOne({ _id: verification.otpRecord._id }),
      PendingRegistration.deleteOne({ _id: pending._id }),
    ]);

    const token = generateToken(user._id);
    return res.status(201).json({
      message: "Account verified successfully. Redirect to dashboard.",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "User already verified. Please sign in." });
    }
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.isVerified) {
      return res.status(400).json({ message: "Invalid credentials or account not verified" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const forgotPasswordRequestOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "User with this email does not exist" });
    }

    const otp = await createOrReplaceOtp(normalizedEmail, "reset_password");
    await sendOTPEmail(normalizedEmail, otp);
    return res.status(200).json({
      message: "Password reset OTP sent successfully",
      email: normalizedEmail,
      otp,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const resendForgotPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "User with this email does not exist" });
    }

    const otp = await createOrReplaceOtp(normalizedEmail, "reset_password");
    await sendOTPEmail(normalizedEmail, otp);
    return res.status(200).json({
      message: "Password reset OTP resent successfully",
      email: normalizedEmail,
      otp,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP and newPassword are required" });
    }

    const normalizedEmail = email.toLowerCase();
    const verification = await verifyOtpCode(normalizedEmail, "reset_password", otp);
    if (!verification.valid) {
      return res.status(400).json({ message: verification.reason });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "User with this email does not exist" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await Promise.all([user.save(), Otp.deleteOne({ _id: verification.otpRecord._id })]);

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  register,
  resendRegistrationOtp,
  verifyRegistrationOtp,
  login,
  forgotPasswordRequestOtp,
  resendForgotPasswordOtp,
  resetPasswordWithOtp,
};
