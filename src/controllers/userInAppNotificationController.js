const UserNotification = require("../models/UserNotification");

const listUserNotifications = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
    const skip = (page - 1) * limit;
    const unreadOnly = String(req.query.unreadOnly || "").toLowerCase() === "true";

    const filter = { userId: req.user._id };
    if (unreadOnly) filter.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      UserNotification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      UserNotification.countDocuments(filter),
      UserNotification.countDocuments({ userId: req.user._id, isRead: false }),
    ]);

    return res.status(200).json({
      message: "Notifications fetched successfully",
      data: notifications,
      unreadCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const markUserNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await UserNotification.findOneAndUpdate(
      { _id: notificationId, userId: req.user._id },
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

const markAllUserNotificationsRead = async (req, res) => {
  try {
    const now = new Date();
    const result = await UserNotification.updateMany(
      { userId: req.user._id, isRead: false },
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
  listUserNotifications,
  markUserNotificationRead,
  markAllUserNotificationsRead,
};
