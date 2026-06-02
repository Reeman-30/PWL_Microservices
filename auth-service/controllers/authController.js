const {
  generateToken,
  generateRefreshToken,
  verifyToken,
} = require("../utils/jwt");
const userService = require("../services/userService");

/**
 * @desc    Handle Google OAuth callback success
 * @route   GET /auth/google/callback
 * @access  Public
 */
exports.googleCallback = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=authentication_failed`,
      );
    }

    // Generate tokens
    const token = generateToken(req.user);
    const refreshToken = generateRefreshToken(req.user);

    // Redirect ke frontend dengan token
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}`;

    console.log("✓ Google authentication successful for:", req.user.email);
    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Google callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
};

/**
 * @desc    Handle authentication failure
 * @route   GET /auth/google/failure
 * @access  Public
 */
exports.authFailure = (req, res) => {
  res.status(401).json({
    success: false,
    message: "Authentication failed",
  });
};

/**
 * @desc    Get current logged in user
 * @route   GET /auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        id: req.user._id,
        googleId: req.user.googleId,
        email: req.user.email,
        name: req.user.name,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        picture: req.user.picture,
        verified: req.user.verified,
        status: req.user.status,
        lastLogin: req.user.lastLogin,
        loginCount: req.user.loginCount,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @desc    Verify JWT token
 * @route   POST /auth/verify
 * @access  Public
 */
exports.verifyToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required",
      });
    }

    // Verify JWT
    const decoded = verifyToken(token);

    // Verify user dari user-services
    const verification = await userService.verifyUser(decoded.id);

    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        message: verification.message,
      });
    }

    res.status(200).json({
      success: true,
      message: "Token is valid",
      data: {
        id: verification.user._id,
        email: verification.user.email,
        name: verification.user.name,
        picture: verification.user.picture,
        status: verification.user.status,
      },
    });
  } catch (error) {
    console.error("Verify token error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /auth/refresh
 * @access  Public
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);

    if (decoded.type !== "refresh") {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Verify user dari user-services
    const verification = await userService.verifyUser(decoded.id);

    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        message: verification.message,
      });
    }

    // Generate new tokens
    const newToken = generateToken(verification.user);
    const newRefreshToken = generateRefreshToken(verification.user);

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
};

/**
 * @desc    Logout user
 * @route   POST /auth/logout
 * @access  Private
 */
exports.logout = (req, res) => {
  try {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({
          success: false,
          message: "Error during logout",
        });
      }

      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
        }

        res.status(200).json({
          success: true,
          message: "Logged out successfully",
        });
      });
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @desc    Get user by ID (for internal service communication)
 * @route   GET /auth/user/:id
 * @access  Private
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @desc    Get authentication statistics
 * @route   GET /auth/stats
 * @access  Private
 */
exports.getStats = async (req, res) => {
  try {
    // Karena kita tidak punya database sendiri,
    // kita bisa forward request ke user-services
    const response = await require("axios").get(
      `${process.env.USER_SERVICE_URL}/api/users/stats`,
      {
        headers: {
          Authorization: req.headers.authorization,
        },
      },
    );

    res.status(200).json({
      success: true,
      data: response.data.data,
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * @desc    Health check for auth service
 * @route   GET /auth/health
 * @access  Public
 */
exports.healthCheck = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Auth service is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: "auth-services",
    version: "1.0.0",
  });
};
