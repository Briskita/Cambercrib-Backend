const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    location: { type: String, required: true, trim: true, maxlength: 300 },
    initialDepositAllowed: { type: Boolean, default: false },
    amenities: [{ type: String, trim: true, maxlength: 120 }],
    contacts: {
      phone: { type: String, trim: true, default: null },
      whatsapp: { type: String, trim: true, default: null },
      email: { type: String, trim: true, lowercase: true, default: null },
    },
    media: {
      images: [{ type: String }],
      documents: [{ type: String }],
      propertyVideoTour: { type: String, default: null },
      propertyLayoutImage: { type: String, default: null },
    },
    soldPlots: { type: Number, default: 0, min: 0 },
    reservedPlots: { type: Number, default: 0, min: 0 },
    availablePlots: { type: Number, default: 0, min: 0 },
    numberOfInvestors: { type: Number, default: 0, min: 0 },
    completionRate: { type: Number, default: 0, min: 0, max: 100 },
    totalInvestment: { type: Number, default: 0, min: 0 },
    unitsCount: { type: Number, default: 0, min: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

propertySchema.index({ title: "text", location: "text", description: "text" });
propertySchema.index({ createdAt: -1 });

module.exports = mongoose.model("Property", propertySchema);
