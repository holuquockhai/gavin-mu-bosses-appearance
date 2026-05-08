import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword, validateResetPasswordToken } from "../api/auth";
import logo from "../assets/logo.png";
import { getPublicBrandingApi } from "../api/systemSettingsApi";

const getErrorMessage = (err, fallback) => {
  const detail = err.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(", ");
  }

  return detail || fallback;
};

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [branding, setBranding] = useState({
    site_logo_url: "",
    site_sublogo_url: "",
    site_head_title: "MU BOSS TIMER",
  });

  useEffect(() => {
    getPublicBrandingApi()
      .then((data) => {
        setBranding({
          site_logo_url: data.site_logo_url || "",
          site_sublogo_url: data.site_sublogo_url || "",
          site_head_title: data.site_head_title || "MU BOSS TIMER",
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.title = `Reset password - ${branding.site_head_title || "MU BOSS TIMER"}`;
  }, [branding.site_head_title]);

  useEffect(() => {
    if (!token) {
      navigate("/404", { replace: true });
      return;
    }

    validateResetPasswordToken(token)
      .then(() => setIsValidatingToken(false))
      .catch((err) => {
        const errorMessage = getErrorMessage(err, "Could not validate password reset link.");

        if (errorMessage === "Password reset link is invalid or expired") {
          navigate("/404", { replace: true });
          return;
        }

        setError(errorMessage);
        setIsValidatingToken(false);
      });
  }, [navigate, token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!token) {
      setError("Password reset token is missing.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    setIsSaving(true);

    try {
      const data = await resetPassword(token, password);
      setMessage(data.message || "Password has been reset successfully.");
      setPassword("");
      setConfirmPassword("");
      navigate("/login", { replace: true });
    } catch (err) {
      const errorMessage = getErrorMessage(err, "Could not reset password.");

      if (errorMessage === "Password reset link is invalid or expired") {
        navigate("/404", { replace: true });
        return;
      }

      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="login-shell min-vh-100">
      <div className="container-fluid h-100">
        <div className="row min-vh-100">
          <div className="col-lg-7 login-visual d-none d-lg-flex">
            <div className="login-visual-content">
              <span className="login-kicker">MU Boss Timer</span>
              <h1>Track bosses, channels, and timers with your team.</h1>
              <p>
                Keep countdowns, appearances, presets, and alerts together in one admin-ready panel.
              </p>
              <div className="login-stat-grid">
                <div>
                  <strong>Secure</strong>
                  <span>account recovery</span>
                </div>
                <div>
                  <strong>Team</strong>
                  <span>shared timers</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-5 login-panel d-flex align-items-center justify-content-center">
            <div className="login-card">
              <div className="login-brand mb-4">
                <img src={logo} alt="MU logo" className="login-logo" />
                <div>
                  <h2 className="mb-1">Welcome back</h2>
                  <p className="mb-0">Sign in to continue managing timers.</p>
                </div>
              </div>

              {message && <div className="alert alert-success">{message}</div>}
              {error && <div className="alert alert-danger">{error}</div>}

              {isValidatingToken ? (
                <p className="small text-muted mb-0">Validating reset link...</p>
              ) : (
                <>
                  <form onSubmit={handleSubmit} id="reset-password-form">
                    <div className="form-floating mb-3">
                      <input
                        id="resetPassword"
                        type="password"
                        className="form-control"
                        placeholder="New password"
                        minLength={6}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                      />
                      <label htmlFor="resetPassword">New password</label>
                    </div>

                    <div className="form-floating mb-4">
                      <input
                        id="resetConfirmPassword"
                        type="password"
                        className="form-control"
                        placeholder="Confirm password"
                        minLength={6}
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        required
                      />
                      <label htmlFor="resetConfirmPassword">Confirm password</label>
                    </div>

                    <button type="submit" className="btn btn-primary w-100 login-submit" disabled={isSaving}>
                      {isSaving ? "Saving..." : "Reset Password"}
                    </button>
                  </form>

                  <div className="text-center mt-3">
                    <Link to="/login" className="small login-link">Back to login</Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ResetPassword;
