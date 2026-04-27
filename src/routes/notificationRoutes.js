const express = require("express");
const {
  updateNotificationPreferences,
  getNotificationPreferences,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getNotificationPreferences);
router.patch("/", protect, updateNotificationPreferences);

module.exports = router;
