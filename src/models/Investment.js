const mongoose = require("mongoose");

const investmentSnapshotSchema = new mongoose.Schema(
  {
    unitName: { type: String, required: true },
    plotSize: { type: Number, required: true },
    outrightAmount: { type: Number, required: true },
    paymentInterval: {
      type: String,
      enum: ["outright", "daily", "weekly", "monthly"],
      required: true,
    },
    initialDepositAmount: { type: Number, default: null },
    periodicInstallmentAmount: { type: Number, default: null },
    interestRatePercent: { type: Number, default: null },
    termMonths: { type: Number, default: null },
    installmentTotalPayable: { type: Number, default: null },
  },
  { _id: false }
);

const investmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    propertyUnitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PropertyUnit",
      required: true,
      index: true,
    },
    paymentInterval: {
      type: String,
      enum: ["outright", "daily", "weekly", "monthly"],
      required: true,
    },
    note: { type: String, trim: true, maxlength: 2000, default: "" },
    snapshot: { type: investmentSnapshotSchema, required: true },
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },
  },
  { timestamps: true }
);

investmentSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Investment", investmentSchema);
