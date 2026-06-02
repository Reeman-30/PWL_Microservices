"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { withAuthRedirect } from "./withAuthRedirect";
import { useAuth } from "./context/auth-context";

function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const validEmail = "pem-web-lanjut@ibik.ac.id";
  const validPassword = "PWL-2026";
  const [formData, setFormData] = useState({
    email: validEmail,
    password: validPassword,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user types
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // TODO: Implement regular login API call
      console.log("Login form submitted with:", formData);
      if (
        formData.email !== validEmail ||
        formData.password !== validPassword
      ) {
        throw new Error("Invalid email or password");
      }

      // Data static untuk user, token, dan refreshToken
      const staticUser = {
        id: "user_001",
        email: "pem-web-lanjut@ibik.ac.id",
        name: "Pemrograman Web Lanjut",
        role: "admin",
        avatar:
          "https://ui-avatars.com/api/?name=PWL+2026&background=0D8ABC&color=fff",
      };
      const staticToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXJfMTc3NzYzMzA5Njc3Ml9sdDRlYzZhcmEiLCJlbWFpbCI6ImZlYnJpZEBpYmlrLmFjLmlkIiwibmFtZSI6IkZlYnJpIERhbWF0cmFzZXRhIEZhaXJ1eiIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3Nzc2MzQ1NDIsImV4cCI6MTc3ODIzOTM0Mn0.ltasWbYWTRPxRsmT5sCBsRdsd2Q-6-I3ZkP1JbwOnOQ";

      const staticRefreshToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXJfMTc3NzYzMzA5Njc3Ml9sdDRlYzZhcmEiLCJlbWFpbCI6ImZlYnJpZEBpYmlrLmFjLmlkIiwibmFtZSI6IkZlYnJpIERhbWF0cmFzZXRhIEZhaXJ1eiIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3Nzc2MzQ1NDIsImV4cCI6MTc3ODIzOTM0Mn0.ltasWbYWTRPxRsmT5sCBsRdsd2Q-6-I3ZkP1JbwOnOQ";

      // Simulasi delay untuk loading effect
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Call login dari auth context dengan data static
      await login(staticUser, staticToken, staticRefreshToken);

      router.push("/modules");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Invalid email or password. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to Google OAuth endpoint
    const authUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL;
    window.location.href = `${authUrl}/auth/google`;
  };

  return (
    <div className="container-fluid">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-md-6 col-lg-4">
          <div className="card shadow-lg border-0">
            <div className="card-body p-5">
              {/* Logo/Title */}
              <div className="text-center mb-4">
                <h2 className="fw-bold text-primary">Welcome Back</h2>
                <p className="text-muted">Sign in to continue</p>
              </div>

              {/* Error Alert */}
              {error && (
                <div
                  className="alert alert-danger alert-dismissible fade show"
                  role="alert"
                >
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setError("")}
                    aria-label="Close"
                  ></button>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit}>
                {/* Email Input */}
                <div className="mb-3">
                  <label htmlFor="email" className="form-label fw-semibold">
                    Email Address
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 border-dark">
                      <i className="bi bi-envelope"></i>
                    </span>
                    <input
                      type="email"
                      className="form-control border-start-0 ps-0 border-dark"
                      id="email"
                      name="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="mb-3">
                  <label htmlFor="password" className="form-label fw-semibold">
                    Password
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-dark border-end-0">
                      <i className="bi bi-lock"></i>
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control border-dark border-start-0 border-end-0 ps-0"
                      id="password"
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                    <button
                      className="btn btn-outline-secondary border-dark border-start-0"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      <i
                        className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                      ></i>
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="rememberMe"
                      disabled={loading}
                    />
                    <label className="form-check-label" htmlFor="rememberMe">
                      Remember me
                    </label>
                  </div>
                  <a
                    href="/forgot-password"
                    className="text-decoration-none small"
                  >
                    Forgot Password?
                  </a>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2 mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Sign In
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="position-relative my-4">
                <hr />
                <span className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted small">
                  OR
                </span>
              </div>

              {/* Google Login Button */}
              <button
                type="button"
                className="btn btn-outline-dark w-100 py-2 d-flex align-items-center justify-content-center"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg
                  className="me-2"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                >
                  <path
                    fill="#4285F4"
                    d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"
                  />
                  <path
                    fill="#34A853"
                    d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"
                  />
                  <path
                    fill="#EA4335"
                    d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"
                  />
                </svg>
                Continue with Google
              </button>

              <button
                type="button"
                className="btn btn-outline-dark w-100 py-2 d-flex align-items-center justify-content-center mt-3"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#000"
                >
                  <path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q134 0 227 93t93 227q0 134-93 227t-227 93Zm0-80q100 0 170-70t70-170q0-17-2.5-33.5T710-546q-15 3-30 4.5t-30 1.5q-63 0-120-24t-102-70q-28 57-77 99t-111 61q3 98 72.5 166T480-240ZM256-566q44-23 67-53.5t45-72.5q-38 20-67 52.5T256-566Zm95.5 154.5Q340-423 340-440t11.5-28.5Q363-480 380-480t28.5 11.5Q420-457 420-440t-11.5 28.5Q397-400 380-400t-28.5-11.5ZM650-620h12q6 0 12-1-33-45-83.5-72T480-720h-12q-6 0-11 1 39 45 82.5 72T650-620Zm-98.5 208.5Q540-423 540-440t11.5-28.5Q563-480 580-480t28.5 11.5Q620-457 620-440t-11.5 28.5Q597-400 580-400t-28.5-11.5ZM40-720v-120q0-33 23.5-56.5T120-920h120v80H120v120H40ZM240-40H120q-33 0-56.5-23.5T40-120v-120h80v120h120v80Zm480 0v-80h120v-120h80v120q0 33-23.5 56.5T840-40H720Zm120-680v-120H720v-80h120q33 0 56.5 23.5T920-840v120h-80Zm-383 1Zm-89 27Z" />
                </svg>
                <span className="ms-2">Login with Face ID</span>
              </button>

              {/* Sign Up Link */}
              <div className="text-center mt-4">
                <p className="text-muted mb-0">
                  Do not have an account?{" "}
                  <a
                    href="/register"
                    className="text-primary text-decoration-none fw-semibold"
                  >
                    Sign Up
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-4">
            <p className="text-muted small">
              © 2025 Febry D Fairuz. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuthRedirect(Login);
