const mongoose = require("mongoose");

const depositRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    receiptUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
      index: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    declineReason: { type: String, trim: true, maxlength: 1000, default: null },
  },
  { timestamps: true }
);

depositRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model("DepositRequest", depositRequestSchema);
