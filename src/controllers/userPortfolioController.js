const User = require("../models/User");
const Investment = require("../models/Investment");

const computeStatus = (inv) => (inv.paymentInterval === "outright" ? "completed" : "ongoing");

const computeAmountPaid = (inv) => {
  if (inv.paymentInterval === "outright") return inv.snapshot?.outrightAmount || 0;
  return inv.snapshot?.initialDepositAmount || 0;
};

const computeOutstanding = (inv) => {
  if (inv.paymentInterval === "outright") return 0;
  const total = inv.snapshot?.installmentTotalPayable || 0;
  const paid = inv.snapshot?.initialDepositAmount || 0;
  return Math.max(total - paid, 0);
};

const formatInvestment = (inv) => ({
  id: inv._id,
  status: computeStatus(inv),
  plan: inv.paymentInterval,
  amountPaid: computeAmountPaid(inv),
  outstandingAmount: computeOutstanding(inv),
  property: inv.propertyId
    ? {
        id: inv.propertyId._id,
        title: inv.propertyId.title || null,
        location: inv.propertyId.location || null,
        coverImage: inv.propertyId.media?.images?.[0] || null,
      }
    : null,
  unit: inv.propertyUnitId
    ? {
        id: inv.propertyUnitId._id,
        name: inv.propertyUnitId.name,
        landmass: inv.propertyUnitId.landmass,
        status: inv.propertyUnitId.status,
      }
    : null,
  snapshot: inv.snapshot,
  note: inv.note || "",
  createdAt: inv.createdAt,
});

const getMyPortfolio = async (req, res) => {
  try {
    const [user, investments] = await Promise.all([
      User.findById(req.user._id).select("walletAmount portfolio totalInvested remainingAmount"),
      Investment.find({ userId: req.user._id, status: "confirmed" })
        .sort({ createdAt: -1 })
        .populate("propertyId", "title location media")
        .populate("propertyUnitId", "name landmass status"),
    ]);

    if (!user) return res.status(404).json({ message: "User not found" });

    const formatted = investments.map(formatInvestment);

    const completedCount = formatted.filter((i) => i.status === "completed").length;
    const ongoingCount = formatted.filter((i) => i.status === "ongoing").length;

    return res.status(200).json({
      message: "Portfolio fetched successfully",
      data: {
        summary: {
          walletAmount: user.walletAmount || 0,
          totalProperties: user.portfolio?.totalProperties || 0,
          totalInvested: user.portfolio?.totalInvested || 0,
          activeInvestment: user.portfolio?.activeInvestment || 0,
          remainingAmount: user.portfolio?.remainingAmount || 0,
          completedCount,
          ongoingCount,
        },
        investments: formatted,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getMyPortfolio };
