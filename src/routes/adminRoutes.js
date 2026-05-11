const express = require("express");
const {
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
} = require("../controllers/adminController");
const { protectAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/users", protectAdmin, listUsers);
router.patch("/me/password", protectAdmin, changeAdminPassword);
router.get("/notifications", protectAdmin, listAdminNotifications);
router.patch("/notifications/read-all", protectAdmin, markAllAdminNotificationsRead);
router.patch("/notifications/:notificationId/read", protectAdmin, markAdminNotificationRead);
router.post("/register", protectAdmin, registerAdmin);
router.post("/register/resend-otp", protectAdmin, resendAdminRegistrationOtp);
router.post("/register/verify-otp", protectAdmin, verifyAdminRegistrationOtp);
router.get("/", protectAdmin, listAdmins);
router.route("/:adminId").get(protectAdmin, getAdminById).patch(protectAdmin, updateAdmin).delete(protectAdmin, deleteAdmin);

module.exports = router;

