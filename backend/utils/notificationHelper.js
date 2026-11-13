const { Notification } = require("../models");

async function notify({ userId, message, type = "info", link = null }) {
  if (!userId) return;

  try {
    await Notification.create({
      userId,
      message,
      type,
      link,
      isRead: false,
    });
  } catch (error) {
    console.error("notify failed:", error.message);
  }
}

async function notifyMany({ userIds, message, type = "info", link = null }) {
  if (!Array.isArray(userIds) || userIds.length === 0) return;

  await Notification.insertMany(
    userIds.map((userId) => ({
      userId,
      message,
      type,
      link,
      isRead: false,
    }))
  );
}

module.exports = { notify, notifyMany };
