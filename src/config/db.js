const mongoose = require("mongoose");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableConnectionError = (error) => {
  if (!error) {
    return false;
  }

  const retryableCodes = new Set(["ESERVFAIL", "ENOTFOUND", "ETIMEDOUT", "ECONNRESET", "ECONNREFUSED"]);
  if (retryableCodes.has(error.code)) {
    return true;
  }

  const retryableMessageParts = [
    "querysrv",
    "querytxt",
    "failed to connect",
    "timed out",
    "topology was destroyed",
    "server selection timed out",
  ];

  const lowerMessage = (error.message || "").toLowerCase();
  return retryableMessageParts.some((part) => lowerMessage.includes(part));
};

const connectDB = async (options = {}) => {
  const {
    maxRetries = Number(process.env.MONGO_CONNECT_MAX_RETRIES || 5),
    retryDelayMs = Number(process.env.MONGO_CONNECT_RETRY_DELAY_MS || 2000),
  } = options;

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing in environment variables");
  }

  let attempt = 0;
  while (attempt < maxRetries) {
    attempt += 1;
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI);
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      const isRetryable = isRetryableConnectionError(error);
      const canRetry = attempt < maxRetries;
      console.error(
        `MongoDB connection attempt ${attempt}/${maxRetries} failed: ${error.message}`
      );

      if (!isRetryable || !canRetry) {
        throw error;
      }

      console.log(`Retrying MongoDB connection in ${retryDelayMs}ms...`);
      await sleep(retryDelayMs);
    }
  }
};

module.exports = connectDB;
