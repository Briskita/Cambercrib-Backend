const User = require("../models/User");
const Property = require("../models/Property");
const PropertyUnit = require("../models/PropertyUnit");
const Investment = require("../models/Investment");

const formatInvestor = (userDoc) => {
  if (!userDoc) return null;
  const firstName = userDoc.firstName || "";
  const lastName = userDoc.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();
  return {
    id: userDoc._id,
    fullName: fullName || userDoc.email || "",
    email: userDoc.email || null,
  };
};

const formatProperty = (propertyDoc) => {
  if (!propertyDoc) return null;
  return {
    id: propertyDoc._id,
    title: propertyDoc.title || null,
    location: propertyDoc.location || null,
  };
};

const computeInvestmentStatus = (investment) => {
  if (investment.paymentInterval === "outright") return "completed";
  return "ongoing";
};

const computeInvestmentAmount = (investment) => {
  if (investment.paymentInterval === "outright") {
    return investment.snapshot?.outrightAmount || 0;
  }
  return investment.snapshot?.initialDepositAmount || 0;
};

const getAdminDashboard = async (req, res) => {
  try {
    const activeUserIdsPromise = Investment.distinct("userId", { status: "confirmed" });

    const [
      totalUsers,
      activeUserIds,
      totalProperties,
      totalUnits,
      recentInvestmentsRaw,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      activeUserIdsPromise,
      Property.countDocuments({}),
      PropertyUnit.countDocuments({}),
      Investment.find({ status: "confirmed" })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("userId", "firstName lastName email")
        .populate("propertyId", "title location")
        .populate("propertyUnitId", "name"),
    ]);

    const recentInvestments = recentInvestmentsRaw.map((inv) => ({
      id: inv._id,
      user: formatInvestor(inv.userId),
      property: formatProperty(inv.propertyId),
      unit: inv.propertyUnitId ? { id: inv.propertyUnitId._id, name: inv.propertyUnitId.name } : null,
      plan: inv.paymentInterval,
      amount: computeInvestmentAmount(inv),
      status: computeInvestmentStatus(inv),
      createdAt: inv.createdAt,
    }));

    return res.status(200).json({
      message: "Admin dashboard data fetched successfully",
      data: {
        totalUsers,
        totalActiveUsers: activeUserIds.length,
        totalProperties,
        totalUnits,
        recentInvestments,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getAdminDashboard };
