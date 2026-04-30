const express = require("express");
const {
  createProperty,
  createPropertyUnits,
  updateProperty,
  deleteProperty,
  updatePropertyUnitStatus,
  updatePropertyUnit,
  deletePropertyUnit,
  listProperties,
  getPropertyById,
} = require("../controllers/propertyController");
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", listProperties);
router.get("/:propertyId", getPropertyById);
router.patch("/:propertyId", protect, updateProperty);
router.delete("/:propertyId", protect, deleteProperty);
router.post(
  "/",
  protect,
  upload.fields([
    { name: "images", maxCount: 15 },
    { name: "documents", maxCount: 10 },
    { name: "propertyVideoTour", maxCount: 1 },
    { name: "propertyLayoutImage", maxCount: 1 },
  ]),
  createProperty
);
router.post("/:propertyId/units", protect, createPropertyUnits);
router.patch("/:propertyId/units/:unitId", protect, updatePropertyUnit);
router.patch("/:propertyId/units/:unitId/status", protect, updatePropertyUnitStatus);
router.delete("/:propertyId/units/:unitId", protect, deletePropertyUnit);

module.exports = router;
