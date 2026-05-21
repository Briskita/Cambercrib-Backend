const Property = require("../models/Property");
const PropertyUnit = require("../models/PropertyUnit");

const refreshPropertyCounters = async (propertyId) => {
  const [unitsCount, availablePlots, reservedPlots, soldPlots] = await Promise.all([
    PropertyUnit.countDocuments({ propertyId }),
    PropertyUnit.countDocuments({ propertyId, status: "available" }),
    PropertyUnit.countDocuments({ propertyId, status: "reserved" }),
    PropertyUnit.countDocuments({ propertyId, status: "sold" }),
  ]);

  await Property.findByIdAndUpdate(
    propertyId,
    { unitsCount, availablePlots, reservedPlots, soldPlots },
    { new: false }
  );
};

module.exports = { refreshPropertyCounters };
