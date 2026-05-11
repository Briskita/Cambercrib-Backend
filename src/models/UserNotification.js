const mongoose = require("mongoose");

const userNotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["deposit_submitted", "deposit_accepted", "deposit_declined"],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    metadata: {
      depositId: { type: mongoose.Schema.Types.ObjectId, ref: "DepositRequest", default: null },
      amount: { type: Number, default: null },
    },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userNotificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("UserNotification", userNotificationSchema);
