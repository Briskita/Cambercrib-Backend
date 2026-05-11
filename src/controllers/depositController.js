const { cloudinary, isCloudinaryConfigured, configureCloudinary } = require("../config/cloudinary");
const User = require("../models/User");
const DepositRequest = require("../models/DepositRequest");
const { notifyAllAdmins } = require("../utils/adminNotifications");
const { createUserNotification } = require("../utils/userNotifications");

const parsePositiveNumber = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  if (typeof value === "string") {
    const normalized = value.trim().replace(/,/g, "");
    if (!normalized) return NaN;
    return Number(normalized);
  }
  return NaN;
};

const uploadBufferToCloudinary = (buffer, folder, resourceType = "auto") =>
  new Promise((resolve, reject) => {
    configureCloudinary();
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });

const createDeposit = async (req, res) => {
  try {
    if (req.user.role === "admin") {
      return res.status(403).json({ message: "Admins cannot submit wallet deposits through this endpoint" });
    }

    if (!isCloudinaryConfigured()) {
      return res.status(500).json({
        message: "Cloudinary is not configured",
        error: "Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET",
      });
    }

    const amount = parsePositiveNumber(req.body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "amount must be a positive number" });
    }

    const file = req.file;
    if (!file || !file.buffer) {
      return res.status(400).json({ message: "receipt file is required (field name: receipt)" });
    }

    const receiptUrl = await uploadBufferToCloudinary(file.buffer, "cambercrib/deposits/receipts", "auto");

    const deposit = await DepositRequest.create({
      userId: req.user._id,
      amount,
      receiptUrl,
      status: "pending",
    });

    await notifyAllAdmins({
      type: "deposit_requested",
      title: "Manual deposit submitted",
      message: `${req.user.firstName} ${req.user.lastName} submitted a deposit of ${amount}.`,
      metadata: {
        userId: req.user._id,
        depositId: deposit._id,
        amount,
        email: req.user.email,
      },
    });

    await createUserNotification(req.user._id, {
      type: "deposit_submitted",
      title: "Deposit request received",
      message: `Your deposit of ${amount} is pending review. We will notify you when it is processed.`,
      metadata: { depositId: deposit._id, amount },
    });

    return res.status(201).json({
      message: "Deposit request submitted successfully",
      data: deposit,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const listMyDeposits = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
    const skip = (page - 1) * limit;
    const { status } = req.query;

    const filter = { userId: req.user._id };
    if (status && ["pending", "accepted", "declined"].includes(status)) {
      filter.status = status;
    }

    const [deposits, total] = await Promise.all([
      DepositRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      DepositRequest.countDocuments(filter),
    ]);

    return res.status(200).json({
      message: "Deposits fetched successfully",
      data: deposits,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const listAllDepositsAdmin = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
    const skip = (page - 1) * limit;
    const { status } = req.query;

    const filter = {};
    if (status && ["pending", "accepted", "declined"].includes(status)) {
      filter.status = status;
    }

    const [deposits, total] = await Promise.all([
      DepositRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "firstName lastName email phoneNumber")
        .populate("reviewedBy", "firstName lastName email"),
      DepositRequest.countDocuments(filter),
    ]);

    return res.status(200).json({
      message: "Deposit requests fetched successfully",
      data: deposits,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const acceptDeposit = async (req, res) => {
  try {
    const { depositId } = req.params;

    const deposit = await DepositRequest.findOneAndUpdate(
      { _id: depositId, status: "pending" },
      {
        status: "accepted",
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      },
      { new: true }
    );
    if (!deposit) {
      return res.status(404).json({ message: "Pending deposit not found" });
    }

    const user = await User.findByIdAndUpdate(
      deposit.userId,
      { $inc: { walletAmount: deposit.amount } },
      { new: true }
    );
    if (!user) {
      await DepositRequest.findByIdAndUpdate(deposit._id, {
        status: "pending",
        reviewedBy: null,
        reviewedAt: null,
      });
      return res.status(404).json({ message: "User for this deposit no longer exists" });
    }

    await createUserNotification(deposit.userId, {
      type: "deposit_accepted",
      title: "Deposit approved",
      message: `Your deposit of ${deposit.amount} has been approved and credited to your wallet.`,
      metadata: { depositId: deposit._id, amount: deposit.amount },
    });

    return res.status(200).json({
      message: "Deposit accepted and wallet credited",
      data: { deposit, userWalletAmount: user.walletAmount },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const declineDeposit = async (req, res) => {
  try {
    const { depositId } = req.params;
    const reason = typeof req.body?.reason === "string" ? req.body.reason.trim().slice(0, 1000) : null;

    const deposit = await DepositRequest.findOneAndUpdate(
      { _id: depositId, status: "pending" },
      {
        status: "declined",
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
        declineReason: reason || null,
      },
      { new: true }
    );

    if (!deposit) {
      return res.status(404).json({ message: "Pending deposit not found" });
    }

    await createUserNotification(deposit.userId, {
      type: "deposit_declined",
      title: "Deposit not approved",
      message: reason
        ? `Your deposit request was declined. Reason: ${reason}`
        : "Your deposit request was declined.",
      metadata: { depositId: deposit._id, amount: deposit.amount },
    });

    return res.status(200).json({
      message: "Deposit declined",
      data: deposit,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createDeposit,
  listMyDeposits,
  listAllDepositsAdmin,
  acceptDeposit,
  declineDeposit,
};
