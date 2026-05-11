const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../middleware/uploadMiddleware");
const { createDeposit, listMyDeposits } = require("../controllers/depositController");

const router = express.Router();

router.post("/", protect, upload.single("receipt"), createDeposit);
router.get("/", protect, listMyDeposits);

module.exports = router;
