const express = require("express");
const { createInvestment, listInvestments } = require("../controllers/investmentController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").get(protect, listInvestments).post(protect, createInvestment);

module.exports = router;
