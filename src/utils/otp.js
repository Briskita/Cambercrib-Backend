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

 const sendOTPEmail = async (email, otp) => {
  if (!process.env.RESEND_API_KEY) {
      throw new Error("Resend API key missing");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
      const { data, error } = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Cambercribe <onboarding@resend.dev>',
          to: email,
          subject: 'Your Verification Code',
          html: `
          <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f9fafb; border-radius: 12px;">
              <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0;">Cambercribe</h1>
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
          console.error('Error sending email via Resend:', error);
          throw new Error('Failed to send OTP email');
      }

      return data;
  } catch (err) {
      console.error('Unexpected error sending email:', err);
      throw err;
  }
};

module.exports = {
  createOrReplaceOtp,
  verifyOtpCode,
  sendOTPEmail,
  OTP_VALID_MINUTES,
};
