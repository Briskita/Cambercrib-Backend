const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    emailNotification: { type: Boolean, default: true },
    smsNotification: { type: Boolean, default: true },
  },
  { _id: false }
);

const portfolioSchema = new mongoose.Schema(
  {
    totalProperties: { type: Number, default: 0 },
    totalInvested: { type: Number, default: 0 },
    activeInvestment: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    referralCode: { type: String, default: null, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    walletAmount: { type: Number, default: 0 },
    totalInvested: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    portfolio: { type: portfolioSchema, default: () => ({}) },
    notifications: { type: notificationSchema, default: () => ({}) },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
