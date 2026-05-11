const UserNotification = require("../models/UserNotification");

const createUserNotification = async (userId, { type, title, message, metadata = {} }) =>
  UserNotification.create({
    userId,
    type,
    title,
    message,
    metadata,
  });

module.exports = { createUserNotification };
