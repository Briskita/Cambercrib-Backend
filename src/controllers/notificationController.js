const User = require("../models/User");

const updateNotificationPreferences = async (req, res) => {
  try {
    const { emailNotification, smsNotification } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (typeof emailNotification === "boolean") {
      user.notifications.emailNotification = emailNotification;
    }
    if (typeof smsNotification === "boolean") {
      user.notifications.smsNotification = smsNotification;
    }

    await user.save();

    return res.status(200).json({
      message: "Notification preferences updated",
      data: user.notifications,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getNotificationPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("notifications");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Notification preferences fetched",
      data: user.notifications,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  updateNotificationPreferences,
  getNotificationPreferences,
};
