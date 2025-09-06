require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
// const rateLimit = require('express-rate-limit');
const db = require("./config/db");

// Import routes
const authRoutes = require("./routes/authRoutes");
const roleRoutes = require("./routes/roleRoutes");
const userRoutes = require("./routes/userRoutes");
const permissionRoutes = require("./routes/permissionRoutes");
const rolePermissionRoutes = require("./routes/rolePermissionRoutes");
const patientRoutes = require("./routes/patientRoutes");
const testGlucosaRoutes = require("./routes/testGlucosaRoutes");
const connectionStatusRoutes = require("./routes/connectionStatusRoutes");
const settingRoutes = require("./routes/settingRoutes");
const staticTokenRoutes = require("./routes/staticTokenRoutes");
const activityLogRoutes = require("./routes/activityLogRoutes");
const roomRoutes = require("./routes/roomRoutes"); // Import room routes
const availableRoomsRoutes = require("./routes/availableRoomRoutes");

// Import health check route
const healthRoutes = require("./routes/healthRoutes");

// Import routes Bridgings
const testGlucosaBridgingRoutes = require("./routes/testGlucosaBridgingRoutes");
const mappingPatientRoutes = require("./routes/mappingPatientRoutes");

const logActivity = require("./models/Logs");
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3002",
  "http://localhost:5001",
  "http://192.168.18.81:3002",
  "http://192.168.18.81:5001",
  "https://rsud-amritambunan.fanscosa.co.id",
  "https://api-rsud-amritambunan.fanscosa.co.id",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Tangani preflight request OPTIONS

// Middleware Keamanan
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(logActivity);

// Test database connection
(async () => {
  try {
    const [rows] = await db.query("SELECT 1");
    console.log("✅ Connection to database successful");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    // Don't exit in production, let health check handle it
    if (process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
  }
})();

// Routes
app.use("/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/role-permissions", rolePermissionRoutes);
app.use("/api/permission", permissionRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/test-glucosa", testGlucosaRoutes);
app.use("/api/connection-status", connectionStatusRoutes);
app.use("/api/setting", settingRoutes);
app.use("/api/static-token", staticTokenRoutes);
app.use("/api/activity-log", activityLogRoutes);
app.use('/api/rooms', roomRoutes); 
app.use('/api/available-rooms', availableRoomsRoutes);


//Routes Bridgings
app.use("/v1/bridging/glucose-test", testGlucosaBridgingRoutes);
app.use("/v1/bridging/mapping-patient", mappingPatientRoutes);

// Health Check routes
app.use("/health", healthRoutes);

// Root endpoint

// Handling 404
app.use((req, res) => {
  res.status(404).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>404 - Not Found</title>
      </head>
      <body>
        <h1>404 - Not Found</h1>
        <p>The page you are looking for does not exist.</p>
      </body>
      </html>
    `);
});
// Global Error Handling
app.use((err, req, res, next) => {
  console.error("Global error handler:", err.stack);
  res.status(500).json({
    message: "Internal Server Error",
    error:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server berjalan di http://0.0.0.0:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📊 Health check: http://0.0.0.0:${PORT}/health`);
});