const dotenv = require("dotenv");
const cloudinary = require("cloudinary").v2;

dotenv.config();

const requiredVars = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];

const sanitizeEnvValue = (value) =>
  String(value || "")
    .trim()
    .replace(/^['"]|['"]$/g, "");

const isCloudinaryConfigured = () => requiredVars.every((key) => Boolean(process.env[key]));

const configureCloudinary = () => {
  if (!isCloudinaryConfigured()) {
    return false;
  }

  cloudinary.config({
    cloud_name: sanitizeEnvValue(process.env.CLOUDINARY_CLOUD_NAME),
    api_key: sanitizeEnvValue(process.env.CLOUDINARY_API_KEY),
    api_secret: sanitizeEnvValue(process.env.CLOUDINARY_API_SECRET),
  });
  return true;
};

configureCloudinary();

module.exports = { cloudinary, isCloudinaryConfigured, configureCloudinary };
