const User = require("../models/User");
const AdminNotification = require("../models/AdminNotification");

const notifyAllAdmins = async ({ type, title, message, metadata = {} }) => {
  const admins = await User.find({ role: "admin" }).select("_id");
  if (!admins.length) return;

  const docs = admins.map((admin) => ({
    adminId: admin._id,
    type,
    title,
    message,
    metadata,
  }));

  await AdminNotification.insertMany(docs);
};

module.exports = { notifyAllAdmins };

