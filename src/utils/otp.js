const Otp = require("../models/Otp");
const { Resend } = require("resend");

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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeFromEmail = (fromEmail) => {
  if (!fromEmail) {
    return "Cambercribe <onboarding@resend.dev>";
  }

  // Normalize "Name<email@domain.com>" to "Name <email@domain.com>".
  return fromEmail.replace(/([^\\s])</, "$1 <").trim();
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

const parseEmailFromDisplayFormat = (value) => {
  const trimmed = String(value || "").trim();
  const match = trimmed.match(/<([^>]+)>/);
  return (match ? match[1] : trimmed).trim();
};

const isTransientResendError = (error) => {
  if (!error) {
    return false;
  }

  const transientCodes = new Set(["ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "ECONNREFUSED"]);
  if (transientCodes.has(error.code)) {
    return true;
  }

  const message = String(error.message || "").toLowerCase();
  return message.includes("unable to fetch data") || message.includes("fetch");
};

const sendOTPEmail = async (email, otp) => {
  if (!process.env.RESEND_API_KEY) {
      throw new Error("Resend API key missing");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = normalizeFromEmail(process.env.RESEND_FROM_EMAIL);
  const to = String(email || "").trim().toLowerCase();
  const maxAttempts = Number(process.env.RESEND_MAX_RETRIES || 3);

  const fromAddress = parseEmailFromDisplayFormat(from);
  if (!isValidEmail(fromAddress)) {
    throw new Error(`Invalid RESEND_FROM_EMAIL value: ${from}`);
  }

  if (!isValidEmail(to)) {
    throw new Error(`Invalid recipient email: ${email}`);
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const { data, error } = await resend.emails.send({
          from,
          to,
          subject: 'Your Verification Code',
          html: `
          <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f9fafb; border-radius: 12px;">
              <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0;">Cambercrib</h1>
              </div>
              <div style="background-color: #ffffff; padding: 32px; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 16px;">Verify your identity</h2>
                  <p style="color: #4b5563; line-height: 24px; margin-bottom: 24px;">Please use the following verification code to complete your request. This code is valid for <b>10 minutes</b>.</p>
                  <div style="background-color: #f3f4f6; border-radius: 6px; padding: 20px; text-align: center; margin-bottom: 24px;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 700; color: #2563eb; letter-spacing: 8px;">${otp}</span>
                  </div>
                  <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">If you didn't request this code, you can safely ignore this email.</p>
              </div>
              <div style="text-align: center; margin-top: 24px;">
                  <p style="color: #9ca3af; font-size: 12px;">&copy; ${new Date().getFullYear()} Cambercribe. All rights reserved.</p>
              </div>
          </div>
          `,
      });

      if (error) {
          const resendError = new Error(
            `Resend API error: ${error.name || "unknown"} - ${error.message || "unknown error"}`
          );
          resendError.code = error.name;
          throw resendError;
      }

      return data;
    } catch (err) {
      const canRetry = attempt < maxAttempts && isTransientResendError(err);
      console.error(
        `Failed to send OTP email (attempt ${attempt}/${maxAttempts}):`,
        err.message || err
      );

      if (!canRetry) {
        throw new Error(`Failed to send OTP email: ${err.message || "unknown error"}`);
      }

      await sleep(800 * attempt);
    }
  }
};

module.exports = {
  createOrReplaceOtp,
  verifyOtpCode,
  sendOTPEmail,
  OTP_VALID_MINUTES,
};
