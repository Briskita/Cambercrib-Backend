const Otp = require("../models/Otp");

const OTP_VALID_MINUTES = 10;

const generateOtpCode = () => `${Math.floor(100000 + Math.random() * 900000)}`;

const createOrReplaceOtp = async (email, purpose) => {
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_VALID_MINUTES * 60 * 1000);

  await Otp.findOneAndUpdate(
    { email: email.toLowerCase(), purpose },
    { code, expiresAt },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return code;
};

const verifyOtpCode = async (email, purpose, code) => {
  const otpRecord = await Otp.findOne({ email: email.toLowerCase(), purpose, code });
  if (!otpRecord) {
    return { valid: false, reason: "Invalid OTP" };
  }

  if (otpRecord.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: otpRecord._id });
    return { valid: false, reason: "OTP expired" };
  }

  return { valid: true, otpRecord };
};

module.exports = {
  createOrReplaceOtp,
  verifyOtpCode,
  OTP_VALID_MINUTES,
};
