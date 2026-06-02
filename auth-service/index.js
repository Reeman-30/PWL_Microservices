require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const passport = require("./config/passport");
const authRoutes = require("./routes/authRoutes");

const app = express();

// Validate required environment variables
const requiredEnvVars = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_CALLBACK_URL",
  "JWT_SECRET",
  "SESSION_SECRET",
];

const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName],
);

if (missingEnvVars.length > 0) {
  console.error("❌ Missing required environment variables:");
  missingEnvVars.forEach((varName) => {
    console.error(`   - ${varName}`);
  });
  process.exit(1);
}

// CORS Configuration
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:8080",
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Request Logger Middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/auth", authRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Auth Service API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    config: {
      googleClientId: process.env.GOOGLE_CLIENT_ID
        ? "✓ Configured"
        : "✗ Missing",
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET
        ? "✓ Configured"
        : "✗ Missing",
      callbackUrl: process.env.GOOGLE_CALLBACK_URL,
      jwtSecret: process.env.JWT_SECRET ? "✓ Configured" : "✗ Missing",
    },
    endpoints: {
      health: "/auth/health",
      test: "/auth/test",
      google: "/auth/google",
      callback: "/auth/google/callback",
      me: "/auth/me",
      verify: "/auth/verify",
      refresh: "/auth/refresh",
      logout: "/auth/logout",
      stats: "/auth/stats",
    },
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error("Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Start Server
const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log("=".repeat(50));
  console.log("🚀 Auth Service Started");
  console.log("=".repeat(50));
  console.log(`📍 Server running on port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  console.log(`🔐 Google OAuth: http://localhost:${PORT}/auth/google`);
  console.log(`💚 Health Check: http://localhost:${PORT}/auth/health`);
  console.log("=".repeat(50));
  console.log("📋 Configuration Status:");
  console.log(
    `   Google Client ID: ${process.env.GOOGLE_CLIENT_ID ? "✓" : "✗"}`,
  );
  console.log(
    `   Google Client Secret: ${process.env.GOOGLE_CLIENT_SECRET ? "✓" : "✗"}`,
  );
  console.log(`   Callback URL: ${process.env.GOOGLE_CALLBACK_URL}`);
  console.log("=".repeat(50));
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});
