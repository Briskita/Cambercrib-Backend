const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const swaggerUi = require("swagger-ui-express");
const multer = require("multer");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const investmentRoutes = require("./routes/investmentRoutes");
const swaggerDocument = require("./docs/swagger");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Cambridge backend is running" });
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/investments", investmentRoutes);

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      message: "Invalid multipart/form-data request",
      error: error.message,
      hint: "Use only allowed file fields: images, documents, propertyVideoTour, propertyLayoutImage",
    });
  }
  return next(error);
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const startServer = async () => {
  const PORT = process.env.PORT || 5000;
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup aborted: unable to connect to MongoDB.");
    console.error(
      "Check MONGODB_URI, DNS/network connectivity, and Atlas IP allowlist before retrying."
    );
    process.exit(1);
  }
};

startServer();
