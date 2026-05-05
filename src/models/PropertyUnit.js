const mongoose = require("mongoose");

const periodicPaymentSchema = new mongoose.Schema(
  {
    installmentAmount: { type: Number, min: 0, default: null },
  },
  { _id: false }
);

const financingSchema = new mongoose.Schema(
  {
    initialDepositAmount: { type: Number, min: 0, default: null },
    interestRatePercent: { type: Number, min: 0, max: 100, default: null },
    termMonths: { type: Number, min: 1, default: null },
    installmentTotalPayable: { type: Number, min: 0, default: null },
    periodicPayments: {
      daily: { type: periodicPaymentSchema, default: () => ({}) },
      weekly: { type: periodicPaymentSchema, default: () => ({}) },
      monthly: { type: periodicPaymentSchema, default: () => ({}) },
    },
  },
  { _id: false }
);

const propertyUnitSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    /** @deprecated use outrightAmount; kept for backward compatibility — synced on save */
    price: { type: Number, required: true, min: 0 },
    /** Full one-off payment (outright). If omitted on create, set from `price`. */
    outrightAmount: { type: Number, min: 0, default: null },
    landmass: { type: Number, required: true, min: 0 },
    financing: { type: financingSchema, default: () => ({}) },
    status: {
      type: String,
      enum: ["available", "reserved", "sold"],
      default: "available",
      index: true,
    },
    investButtonLabel: { type: String, default: "Invest", trim: true, maxlength: 60 },
  },
  { timestamps: true }
);

propertyUnitSchema.pre("save", function syncOutrightAndPrice(next) {
  if (this.outrightAmount == null && this.price != null) {
    this.outrightAmount = this.price;
  } else if (this.outrightAmount != null) {
    this.price = this.outrightAmount;
  }
  next();
});

propertyUnitSchema.index({ propertyId: 1, status: 1 });
propertyUnitSchema.index({ propertyId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("PropertyUnit", propertyUnitSchema);
