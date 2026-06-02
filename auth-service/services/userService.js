// Static users database (in-memory)
const staticUsers = new Map();

// Helper function to generate user ID
const generateUserId = () => {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create or update user in static storage
 */
const createOrUpdateUser = async (googleProfile) => {
  try {
    const email = googleProfile.emails[0].value;

    // Check if user already exists
    let user = Array.from(staticUsers.values()).find((u) => u.email === email);

    if (user) {
      // Update existing user
      user.name = googleProfile.displayName;
      user.firstName = googleProfile.name?.givenName;
      user.lastName = googleProfile.name?.familyName;
      user.picture = googleProfile.photos?.[0]?.value;
      user.verified = googleProfile._json?.email_verified || false;
      user.lastLogin = new Date();
      user.loginCount = (user.loginCount || 0) + 1;
      user.updatedAt = new Date();

      console.log("✓ User updated in static storage:", email);
    } else {
      // Create new user
      const userId = generateUserId();
      user = {
        _id: userId,
        googleId: googleProfile.id,
        email: email,
        name: googleProfile.displayName,
        firstName: googleProfile.name?.givenName,
        lastName: googleProfile.name?.familyName,
        picture: googleProfile.photos?.[0]?.value,
        verified: googleProfile._json?.email_verified || false,
        status: "active",
        role: "user",
        lastLogin: new Date(),
        loginCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      staticUsers.set(userId, user);
      console.log("✓ New user created in static storage:", email);
    }

    return user;
  } catch (error) {
    console.error("✗ Error creating/updating user:", error.message);
    throw new Error("Failed to create/update user");
  }
};

/**
 * Get user by ID from static storage
 */
const getUserById = async (userId) => {
  try {
    const user = staticUsers.get(userId);

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("✗ Error getting user by ID:", error.message);
    throw new Error("Failed to get user");
  }
};

/**
 * Get user by email from static storage
 */
const getUserByEmail = async (email) => {
  try {
    const user = Array.from(staticUsers.values()).find(
      (u) => u.email === email,
    );
    return user || null;
  } catch (error) {
    console.error("✗ Error getting user by email:", error.message);
    throw new Error("Failed to get user by email");
  }
};

/**
 * Update user login info
 */
const updateLoginInfo = async (userId) => {
  try {
    const user = staticUsers.get(userId);

    if (user) {
      user.lastLogin = new Date();
      user.loginCount = (user.loginCount || 0) + 1;
      user.updatedAt = new Date();

      console.log("✓ Login info updated for user:", user.email);
    }
  } catch (error) {
    console.error("✗ Error updating login info:", error.message);
    // Don't throw error, just log it
  }
};

/**
 * Verify user exists and is active
 */
const verifyUser = async (userId) => {
  try {
    const user = await getUserById(userId);

    if (!user) {
      return { valid: false, message: "User not found" };
    }

    if (user.status !== "active") {
      return { valid: false, message: "User account is not active" };
    }

    return { valid: true, user };
  } catch (error) {
    return { valid: false, message: "Failed to verify user" };
  }
};

/**
 * Get all users (for debugging)
 */
const getAllUsers = () => {
  return Array.from(staticUsers.values());
};

module.exports = {
  createOrUpdateUser,
  getUserById,
  getUserByEmail,
  updateLoginInfo,
  verifyUser,
  getAllUsers,
};
