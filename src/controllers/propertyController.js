const Property = require("../models/Property");
const PropertyUnit = require("../models/PropertyUnit");
const { cloudinary, isCloudinaryConfigured, configureCloudinary } = require("../config/cloudinary");
const VALID_UNIT_STATUSES = new Set(["available", "reserved", "sold"]);

const parseJsonArrayField = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
};

const parseJsonObjectField = (value) => {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (_) {
    return {};
  }
};

const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
};

const uploadBufferToCloudinary = (buffer, folder, resourceType = "image") =>
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

const uploadSingleFile = async (file, folder, resourceType = "image") => {
  if (!file) return null;
  return uploadBufferToCloudinary(file.buffer, folder, resourceType);
};

const uploadMultipleFiles = async (files, folder, resourceType = "image") => {
  if (!files?.length) return [];
  return Promise.all(files.map((file) => uploadBufferToCloudinary(file.buffer, folder, resourceType)));
};

const filesFromAliases = (filesObject, aliases) => {
  if (!filesObject) return [];
  return aliases.flatMap((alias) => filesObject[alias] || []);
};

const parsePositiveNumber = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  if (typeof value === "string") {
    const normalized = value.trim().replace(/,/g, "");
    if (!normalized) return NaN;
    return Number(normalized);
  }
  return NaN;
};

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

const createProperty = async (req, res) => {
  try {
    if (!isCloudinaryConfigured()) {
      return res.status(500).json({
        message: "Cloudinary is not configured",
        error: "Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET",
      });
    }

    const { title, description, location } = req.body;
    if (!title || !description || !location) {
      return res.status(400).json({ message: "title, description and location are required" });
    }

    const amenities = parseJsonArrayField(req.body.amenities).filter(Boolean);
    const contacts = parseJsonObjectField(req.body.contacts);

    const imageFiles = filesFromAliases(req.files, ["images", "images[]"]);
    const documentFiles = filesFromAliases(req.files, ["documents", "documents[]"]);
    const layoutFile = filesFromAliases(req.files, ["propertyLayoutImage", "propertyLayoutImage[]"])[0];
    const videoFile = filesFromAliases(req.files, ["propertyVideoTour", "propertyVideoTour[]"])[0];

    const [images, documents, propertyLayoutImage, propertyVideoTour] = await Promise.all([
      uploadMultipleFiles(imageFiles, "cambercrib/properties/images", "image"),
      uploadMultipleFiles(documentFiles, "cambercrib/properties/documents", "raw"),
      uploadSingleFile(layoutFile, "cambercrib/properties/layout", "image"),
      uploadSingleFile(videoFile, "cambercrib/properties/videos", "video"),
    ]);

    const property = await Property.create({
      title,
      description,
      location,
      initialDepositAllowed: toBoolean(req.body.initialDepositAllowed),
      amenities,
      contacts: {
        phone: contacts.phone || null,
        whatsapp: contacts.whatsapp || null,
        email: contacts.email || null,
      },
      media: {
        images,
        documents,
        propertyLayoutImage,
        propertyVideoTour,
      },
      soldPlots: 0,
      reservedPlots: 0,
      availablePlots: 0,
      numberOfInvestors: Number(req.body.numberOfInvestors || 0),
      completionRate: Number(req.body.completionRate || 0),
      totalInvestment: Number(req.body.totalInvestment || 0),
      createdBy: req.user._id,
    });

    return res.status(201).json({
      message: "Property created successfully",
      data: property,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createPropertyUnits = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    let units = req.body.units;
    if (typeof units === "string") {
      units = JSON.parse(units);
    }

    if (!Array.isArray(units) || !units.length) {
      return res.status(400).json({ message: "units must be a non-empty array" });
    }

    const invalidUnits = [];
    const unitDocs = units.map((unit, index) => {
      const price = parsePositiveNumber(unit.price);
      const landmass = parsePositiveNumber(unit.landmass);
      const name = String(unit.name || "").trim();

      if (!name || !Number.isFinite(price) || !Number.isFinite(landmass)) {
        invalidUnits.push({
          index,
          name: unit.name,
          price: unit.price,
          landmass: unit.landmass,
          error: "name, price and landmass are required; price/landmass must be numeric",
        });
      }

      return {
        propertyId,
        name,
        price,
        landmass,
        status: VALID_UNIT_STATUSES.has(unit.status) ? unit.status : "available",
        investButtonLabel: unit.investButtonLabel || "Invest",
      };
    });

    if (invalidUnits.length) {
      return res.status(400).json({
        message: "Invalid unit payload",
        errors: invalidUnits,
      });
    }

    const createdUnits = await PropertyUnit.insertMany(unitDocs, { ordered: false });
    if (!createdUnits.length) {
      return res.status(400).json({
        message: "No units were created",
        error: "Check payload values and duplicate unit names",
      });
    }
    await refreshPropertyCounters(propertyId);

    return res.status(201).json({
      message: "Property units created successfully",
      count: createdUnits.length,
      data: createdUnits,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({
        message: "Duplicate unit name detected for this property",
        error: "Each unit name must be unique within a property",
      });
    }
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const updates = {};
    const allowedFields = [
      "title",
      "description",
      "location",
      "initialDepositAllowed",
      "numberOfInvestors",
      "completionRate",
      "totalInvestment",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "initialDepositAllowed") {
          updates[field] = toBoolean(req.body[field]);
        } else if (["numberOfInvestors", "completionRate", "totalInvestment"].includes(field)) {
          updates[field] = Number(req.body[field]);
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    if (req.body.amenities !== undefined) {
      updates.amenities = parseJsonArrayField(req.body.amenities).filter(Boolean);
    }
    if (req.body.contacts !== undefined) {
      const contacts = parseJsonObjectField(req.body.contacts);
      updates.contacts = {
        phone: contacts.phone || null,
        whatsapp: contacts.whatsapp || null,
        email: contacts.email || null,
      };
    }

    const property = await Property.findByIdAndUpdate(propertyId, updates, {
      new: true,
      runValidators: true,
    });

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    return res.status(200).json({
      message: "Property updated successfully",
      data: property,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const property = await Property.findByIdAndDelete(propertyId);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    await PropertyUnit.deleteMany({ propertyId });

    return res.status(200).json({
      message: "Property and associated units deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updatePropertyUnitStatus = async (req, res) => {
  try {
    const { propertyId, unitId } = req.params;
    const { status } = req.body;

    if (!VALID_UNIT_STATUSES.has(status)) {
      return res.status(400).json({
        message: "Invalid status",
        error: "status must be one of: available, reserved, sold",
      });
    }

    const unit = await PropertyUnit.findOneAndUpdate(
      { _id: unitId, propertyId },
      { status },
      { new: true, runValidators: true }
    );

    if (!unit) {
      return res.status(404).json({ message: "Unit not found for this property" });
    }

    await refreshPropertyCounters(propertyId);

    return res.status(200).json({
      message: "Unit status updated successfully",
      data: unit,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updatePropertyUnit = async (req, res) => {
  try {
    const { propertyId, unitId } = req.params;
    const updates = {};
    const allowedFields = ["name", "price", "landmass", "status", "investButtonLabel"];

    allowedFields.forEach((field) => {
      if (req.body[field] === undefined) return;
      if (field === "price" || field === "landmass") {
        updates[field] = Number(req.body[field]);
        return;
      }
      if (field === "status") {
        if (!VALID_UNIT_STATUSES.has(req.body.status)) {
          return;
        }
        updates.status = req.body.status;
        return;
      }
      updates[field] = req.body[field];
    });

    if (req.body.status !== undefined && !VALID_UNIT_STATUSES.has(req.body.status)) {
      return res.status(400).json({
        message: "Invalid status",
        error: "status must be one of: available, reserved, sold",
      });
    }

    const unit = await PropertyUnit.findOneAndUpdate({ _id: unitId, propertyId }, updates, {
      new: true,
      runValidators: true,
    });

    if (!unit) {
      return res.status(404).json({ message: "Unit not found for this property" });
    }

    await refreshPropertyCounters(propertyId);

    return res.status(200).json({
      message: "Unit updated successfully",
      data: unit,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({
        message: "Duplicate unit name detected for this property",
        error: "Each unit name must be unique within a property",
      });
    }
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deletePropertyUnit = async (req, res) => {
  try {
    const { propertyId, unitId } = req.params;
    const unit = await PropertyUnit.findOneAndDelete({ _id: unitId, propertyId });

    if (!unit) {
      return res.status(404).json({ message: "Unit not found for this property" });
    }

    await refreshPropertyCounters(propertyId);

    return res.status(200).json({
      message: "Unit deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const listProperties = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100);
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim();

    const filter = {};
    if (search) {
      filter.$text = { $search: search };
    }

    const [properties, total] = await Promise.all([
      Property.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Property.countDocuments(filter),
    ]);

    return res.status(200).json({
      message: "Properties fetched successfully",
      data: properties,
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

const getPropertyById = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const units = await PropertyUnit.find({ propertyId }).sort({ createdAt: -1 });
    const availableUnits = units.filter((unit) => unit.status === "available");
    const reservedUnits = units.filter((unit) => unit.status === "reserved");
    const soldUnits = units.filter((unit) => unit.status === "sold");

    return res.status(200).json({
      message: "Property fetched successfully",
      data: {
        property,
        units,
        unitSummary: {
          total: units.length,
          available: availableUnits.length,
          reserved: reservedUnits.length,
          sold: soldUnits.length,
        },
        availableUnits,
        reservedUnits,
        soldUnits,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createProperty,
  createPropertyUnits,
  updateProperty,
  deleteProperty,
  updatePropertyUnitStatus,
  updatePropertyUnit,
  deletePropertyUnit,
  listProperties,
  getPropertyById,
};
