const express = require("express");
const {
  register,
  resendRegistrationOtp,
  verifyRegistrationOtp,
  login,
  forgotPasswordRequestOtp,
  resendForgotPasswordOtp,
  resetPasswordWithOtp,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/register/resend-otp", resendRegistrationOtp);
router.post("/register/verify-otp", verifyRegistrationOtp);
router.post("/login", login);
router.post("/forgot-password/request-otp", forgotPasswordRequestOtp);
router.post("/forgot-password/resend-otp", resendForgotPasswordOtp);
router.post("/forgot-password/reset", resetPasswordWithOtp);

module.exports = router;
