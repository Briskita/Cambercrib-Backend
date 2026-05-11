/**
 * Admin self-registration (OTP flow) must NOT require an existing admin session.
 * Optionally set ADMIN_REGISTRATION_SECRET in env and send the same value as:
 * header `x-admin-registration-secret` or body `registrationSecret`.
 */
const requireAdminRegistrationSecretIfConfigured = (req, res, next) => {
  const secret = process.env.ADMIN_REGISTRATION_SECRET;
  if (!secret) return next();

  const provided =
    req.headers["x-admin-registration-secret"] || req.body?.registrationSecret;
  if (provided !== secret) {
    return res.status(403).json({
      message: "Admin registration is protected. Provide a valid registration secret.",
      hint: "Send header x-admin-registration-secret or body registrationSecret matching ADMIN_REGISTRATION_SECRET",
    });
  }
  return next();
};

module.exports = { requireAdminRegistrationSecretIfConfigured };
