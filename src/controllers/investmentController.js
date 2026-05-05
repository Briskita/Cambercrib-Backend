const Property = require("../models/Property");
const PropertyUnit = require("../models/PropertyUnit");
const Investment = require("../models/Investment");

const PAYMENT_INTERVALS = new Set(["outright", "daily", "weekly", "monthly"]);

const getOutrightAmount = (unit) =>
  unit.outrightAmount != null ? unit.outrightAmount : unit.price;

const resolvePeriodicAmount = (unit, interval) => {
  const raw = unit.financing?.periodicPayments?.[interval]?.installmentAmount;
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
};

const createInvestment = async (req, res) => {
  try {
    const { propertyId, propertyUnitId, paymentInterval, note } = req.body;

    if (!propertyId || !propertyUnitId || !paymentInterval) {
      return res.status(400).json({
        message: "propertyId, propertyUnitId and paymentInterval are required",
      });
    }

    if (!PAYMENT_INTERVALS.has(paymentInterval)) {
      return res.status(400).json({
        message: "paymentInterval must be one of: outright, daily, weekly, monthly",
      });
    }

    const [property, unit] = await Promise.all([
      Property.findById(propertyId),
      PropertyUnit.findOne({ _id: propertyUnitId, propertyId }),
    ]);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    if (!unit) {
      return res.status(404).json({ message: "Property unit not found for this property" });
    }

    if (unit.status !== "available") {
      return res.status(400).json({
        message: "This plot is not available for investment",
        status: unit.status,
      });
    }

    const outrightAmount = getOutrightAmount(unit);
    const financing = unit.financing || {};

    if (paymentInterval !== "outright" && !property.initialDepositAllowed) {
      return res.status(400).json({
        message: "This property does not allow installment plans; use outright payment",
      });
    }

    let initialDepositAmount = null;
    let periodicInstallmentAmount = null;
    let interestRatePercent = null;
    let termMonths = null;
    let installmentTotalPayable = null;

    if (paymentInterval === "outright") {
      periodicInstallmentAmount = null;
      initialDepositAmount = null;
    } else {
      interestRatePercent = financing.interestRatePercent ?? null;
      termMonths = financing.termMonths ?? null;
      installmentTotalPayable = financing.installmentTotalPayable ?? null;
      initialDepositAmount =
        typeof financing.initialDepositAmount === "number"
          ? financing.initialDepositAmount
          : null;
      periodicInstallmentAmount = resolvePeriodicAmount(unit, paymentInterval);

      if (initialDepositAmount == null) {
        return res.status(400).json({
          message: "This unit has no initialDepositAmount configured for installment plans",
        });
      }
      if (periodicInstallmentAmount == null) {
        return res.status(400).json({
          message: `This unit has no ${paymentInterval} installmentAmount configured (financing.periodicPayments.${paymentInterval})`,
        });
      }
    }

    const snapshot = {
      unitName: unit.name,
      plotSize: unit.landmass,
      outrightAmount,
      paymentInterval,
      initialDepositAmount,
      periodicInstallmentAmount,
      interestRatePercent,
      termMonths,
      installmentTotalPayable,
    };

    const investment = await Investment.create({
      userId: req.user._id,
      propertyId,
      propertyUnitId,
      paymentInterval,
      note: typeof note === "string" ? note.trim() : "",
      snapshot,
      status: "confirmed",
    });

    return res.status(201).json({
      message: "Investment confirmed",
      data: investment,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const listInvestments = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
    const skip = (page - 1) * limit;

    const [investments, total] = await Promise.all([
      Investment.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "firstName lastName email phoneNumber")
        .populate("propertyId", "title location")
        .populate("propertyUnitId", "name landmass outrightAmount price status"),
      Investment.countDocuments({}),
    ]);

    return res.status(200).json({
      message: "Investments fetched successfully",
      data: investments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  listInvestments,
  createInvestment,
};
