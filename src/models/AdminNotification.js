const mongoose = require("mongoose");

const adminNotificationSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["user_registered", "password_reset_requested", "investment_created", "deposit_requested"],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    metadata: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", default: null },
      propertyUnitId: { type: mongoose.Schema.Types.ObjectId, ref: "PropertyUnit", default: null },
      investmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Investment", default: null },
      depositId: { type: mongoose.Schema.Types.ObjectId, ref: "DepositRequest", default: null },
      amount: { type: Number, default: null },
      email: { type: String, default: null },
    },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

adminNotificationSchema.index({ adminId: 1, createdAt: -1 });

module.exports = mongoose.model("AdminNotification", adminNotificationSchema);

