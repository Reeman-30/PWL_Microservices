const { verifyToken } = require("../utils/jwt");
const userService = require("../services/userService");

exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route. Please login.",
      });
    }

    try {
      // Verify token
      const decoded = verifyToken(token);

      // Get user from user-services
      const user = await userService.getUserById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      // Check if user is active
      if (user.status !== "active") {
        return res.status(403).json({
          success: false,
          message: `Account is ${user.status}. Please contact administrator.`,
        });
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Error in authentication",
      error: error.message,
    });
  }
};
