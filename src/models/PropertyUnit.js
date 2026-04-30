const mongoose = require("mongoose");

const propertyUnitSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    price: { type: Number, required: true, min: 0 },
    landmass: { type: Number, required: true, min: 0 },
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

propertyUnitSchema.index({ propertyId: 1, status: 1 });
propertyUnitSchema.index({ propertyId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("PropertyUnit", propertyUnitSchema);
