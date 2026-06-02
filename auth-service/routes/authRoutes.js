const express = require("express");
const passport = require("passport");
const authController = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

/**
 * @route   GET /auth/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get("/health", authController.healthCheck);

/**
 * @route   GET /auth/google
 * @desc    Initiate Google OAuth authentication
 * @access  Public
 */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account", // Force account selection
  }),
);

/**
 * @route   GET /auth/google/callback
 * @desc    Google OAuth callback URL
 * @access  Public
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/failure",
    session: true,
  }),
  authController.googleCallback,
);

/**
 * @route   GET /auth/failure
 * @desc    Authentication failure handler
 * @access  Public
 */
router.get("/failure", authController.authFailure);

/**
 * @route   GET /auth/me
 * @desc    Get current authenticated user profile
 * @access  Private
 */
router.get("/me", protect, authController.getMe);

/**
 * @route   POST /auth/verify
 * @desc    Verify JWT token validity
 * @access  Public
 */
router.post("/verify", authController.verifyToken);

/**
 * @route   POST /auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post("/refresh", authController.refreshToken);

/**
 * @route   POST /auth/logout
 * @desc    Logout user and destroy session
 * @access  Private
 */
router.post("/logout", protect, authController.logout);

/**
 * @route   GET /auth/user/:id
 * @desc    Get user by ID (for internal service communication)
 * @access  Private
 */
router.get("/user/:id", protect, authController.getUserById);

/**
 * @route   GET /auth/stats
 * @desc    Get authentication statistics
 * @access  Private (Admin only - handled by user-services)
 */
router.get("/stats", protect, authController.getStats);

/**
 * @route   GET /auth/test
 * @desc    Test endpoint to check if auth service is running
 * @access  Public
 */
router.get("/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Auth service is running",
    timestamp: new Date().toISOString(),
    endpoints: {
      google: "/auth/google",
      callback: "/auth/google/callback",
      me: "/auth/me (Protected)",
      verify: "/auth/verify (POST)",
      refresh: "/auth/refresh (POST)",
      logout: "/auth/logout (POST, Protected)",
      stats: "/auth/stats (Protected)",
      health: "/auth/health",
    },
  });
});

module.exports = router;
