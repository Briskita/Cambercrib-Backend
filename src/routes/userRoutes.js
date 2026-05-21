const express = require("express");
const { getProfile, updateProfile } = require("../controllers/userController");
const {
  listUserNotifications,
  markUserNotificationRead,
  markAllUserNotificationsRead,
} = require("../controllers/userInAppNotificationController");
const { getMyPortfolio } = require("../controllers/userPortfolioController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/notifications", protect, listUserNotifications);
router.patch("/notifications/read-all", protect, markAllUserNotificationsRead);
router.patch("/notifications/:notificationId/read", protect, markUserNotificationRead);

router.get("/portfolio", protect, getMyPortfolio);
router.get("/profile", protect, getProfile);
router.patch("/profile", protect, updateProfile);

module.exports = router;
