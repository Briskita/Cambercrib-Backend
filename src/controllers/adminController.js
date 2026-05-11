const bcrypt = require("bcryptjs");
const User = require("../models/User");
const AdminNotification = require("../models/AdminNotification");
const Otp = require("../models/Otp");
const PendingAdminRegistration = require("../models/PendingAdminRegistration");
const { createOrReplaceOtp, verifyOtpCode, sendOTPEmail } = require("../utils/otp");

const toSafeAdmin = (adminDoc) => ({
  id: adminDoc._id,
  firstName: adminDoc.firstName,
  lastName: adminDoc.lastName,
  phoneNumber: adminDoc.phoneNumber,
  email: adminDoc.email,
  role: adminDoc.role,
  createdAt: adminDoc.createdAt,
  updatedAt: adminDoc.updatedAt,
});

const registerAdmin = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, email, password } = req.body;
    if (!firstName || !lastName || !phoneNumber || !email || !password) {
      return res.status(400).json({ message: "firstName, lastName, phoneNumber, email and password are required" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: "A user with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await PendingAdminRegistration.findOneAndUpdate(
      { email: normalizedEmail },
      {
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        phoneNumber: String(phoneNumber).trim(),
        email: normalizedEmail,
        password: hashedPassword,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const otp = await createOrReplaceOtp(normalizedEmail, "verify_admin_account");
    await sendOTPEmail(normalizedEmail, otp);

    return res.status(200).json({
      message: "Admin registration initiated. Verify OTP to create admin account.",
      email: normalizedEmail,
      otp,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const resendAdminRegistrationOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const pending = await PendingAdminRegistration.findOne({ email: normalizedEmail });
    if (!pending) {
      return res.status(404).json({ message: "No pending admin registration found for this email" });
    }

    const otp = await createOrReplaceOtp(normalizedEmail, "verify_admin_account");
    await sendOTPEmail(normalizedEmail, otp);
    return res.status(200).json({
      message: "Admin registration OTP resent successfully",
      email: normalizedEmail,
      otp,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const verifyAdminRegistrationOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const verification = await verifyOtpCode(normalizedEmail, "verify_admin_account", otp);
    if (!verification.valid) {
      return res.status(400).json({ message: verification.reason });
    }

    const pending = await PendingAdminRegistration.findOne({ email: normalizedEmail });
    if (!pending) {
      return res.status(404).json({ message: "No pending admin registration found for this email" });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      await Promise.all([
        Otp.deleteOne({ _id: verification.otpRecord._id }),
        PendingAdminRegistration.deleteOne({ _id: pending._id }),
      ]);
      return res.status(400).json({ message: "A user with this email already exists" });
    }

    const admin = await User.create({
      firstName: pending.firstName,
      lastName: pending.lastName,
      phoneNumber: pending.phoneNumber,
      email: pending.email,
      password: pending.password,
      isVerified: true,
      role: "admin",
    });

    await Promise.all([
      Otp.deleteOne({ _id: verification.otpRecord._id }),
      PendingAdminRegistration.deleteOne({ _id: pending._id }),
    ]);

    return res.status(201).json({
      message: "Admin account verified and created successfully",
      data: toSafeAdmin(admin),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Admin already verified. Please sign in." });
    }
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const listAdmins = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
    const skip = (page - 1) * limit;

    const [admins, total] = await Promise.all([
      User.find({ role: "admin" }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments({ role: "admin" }),
    ]);

    return res.status(200).json({
      message: "Admins fetched successfully",
      data: admins.map(toSafeAdmin),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAdminById = async (req, res) => {
  try {
    const admin = await User.findOne({ _id: req.params.adminId, role: "admin" });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    return res.status(200).json({
      message: "Admin fetched successfully",
      data: toSafeAdmin(admin),
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { firstName, lastName, phoneNumber, email, password } = req.body;
    const updates = {};

    if (firstName !== undefined) updates.firstName = String(firstName).trim();
    if (lastName !== undefined) updates.lastName = String(lastName).trim();
    if (phoneNumber !== undefined) updates.phoneNumber = String(phoneNumber).trim();
    if (email !== undefined) updates.email = String(email).toLowerCase().trim();
    if (password !== undefined) {
      if (!String(password).trim()) {
        return res.status(400).json({ message: "password cannot be empty" });
      }
      updates.password = await bcrypt.hash(password, 10);
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const admin = await User.findOneAndUpdate({ _id: adminId, role: "admin" }, updates, {
      new: true,
      runValidators: true,
    });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    return res.status(200).json({
      message: "Admin updated successfully",
      data: toSafeAdmin(admin),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already in use" });
    }
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    if (String(req.user._id) === String(adminId)) {
      return res.status(400).json({ message: "You cannot delete your own admin account" });
    }

    const admin = await User.findOneAndDelete({ _id: adminId, role: "admin" });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    return res.status(200).json({ message: "Admin deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const listUsers = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim();

    const filter = {};
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      message: "Users fetched successfully",
      data: users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "currentPassword and newPassword are required" });
    }
    if (String(newPassword).trim().length < 6) {
      return res.status(400).json({ message: "newPassword must be at least 6 characters" });
    }

    const admin = await User.findById(req.user._id);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: admin access required" });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    return res.status(200).json({ message: "Admin password changed successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const listAdminNotifications = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
    const skip = (page - 1) * limit;
    const unreadOnly = String(req.query.unreadOnly || "").toLowerCase() === "true";
    const filter = { adminId: req.user._id };
    if (unreadOnly) filter.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      AdminNotification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      AdminNotification.countDocuments(filter),
      AdminNotification.countDocuments({ adminId: req.user._id, isRead: false }),
    ]);

    return res.status(200).json({
      message: "Admin notifications fetched successfully",
      data: notifications,
      unreadCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const markAdminNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await AdminNotification.findOneAndUpdate(
      { _id: notificationId, adminId: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    return res.status(200).json({
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const markAllAdminNotificationsRead = async (req, res) => {
  try {
    const now = new Date();
    const result = await AdminNotification.updateMany(
      { adminId: req.user._id, isRead: false },
      { isRead: true, readAt: now }
    );
    return res.status(200).json({
      message: "All notifications marked as read",
      updatedCount: result.modifiedCount || 0,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  registerAdmin,
  resendAdminRegistrationOtp,
  verifyAdminRegistrationOtp,
  listAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  listUsers,
  changeAdminPassword,
  listAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
};

