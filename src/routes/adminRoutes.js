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
const {
  listAllDepositsAdmin,
  acceptDeposit,
  declineDeposit,
} = require("../controllers/depositController");
const { getAdminDashboard } = require("../controllers/adminDashboardController");
const { protectAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/register/resend-otp", resendAdminRegistrationOtp);
router.post("/register/verify-otp", verifyAdminRegistrationOtp);

router.get("/dashboard", protectAdmin, getAdminDashboard);
router.get("/users", protectAdmin, listUsers);
router.patch("/me/password", protectAdmin, changeAdminPassword);
router.get("/notifications", protectAdmin, listAdminNotifications);
router.patch("/notifications/read-all", protectAdmin, markAllAdminNotificationsRead);
router.patch("/notifications/:notificationId/read", protectAdmin, markAdminNotificationRead);

router.get("/deposits", protectAdmin, listAllDepositsAdmin);
router.patch("/deposits/:depositId/accept", protectAdmin, acceptDeposit);
router.patch("/deposits/:depositId/decline", protectAdmin, declineDeposit);

router.get("/", protectAdmin, listAdmins);
router.route("/:adminId").get(protectAdmin, getAdminById).patch(protectAdmin, updateAdmin).delete(protectAdmin, deleteAdmin);

module.exports = router;

