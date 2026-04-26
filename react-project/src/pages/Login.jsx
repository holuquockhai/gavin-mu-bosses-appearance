import { useState, useEffect } from "react";
import { useNavigate, Navigate, useLocation } from "react-router-dom";
import { forgotPassword, loginUser } from "../api/auth";
import "../scss/login_page.scss";
import { saveAuth, isAuthenticated } from "../utils/auth";
import logo from "../assets/logo.png";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    const root = document.getElementById("root");
    root?.classList.add("login-page");

    return () => {
      root?.classList.remove("login-page");
    };
  }, []);

  if (isAuthenticated()) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const data = await loginUser(email, password);
      saveAuth(data);
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotMessage("");
    setIsSendingReset(true);

    try {
      const data = await forgotPassword(forgotEmail);
      setForgotMessage(data.message || "Please check your email for reset instructions.");
    } catch (err) {
      setForgotError(
        err.response?.data?.detail ||
          "Could not send password reset instructions.",
      );
    } finally {
      setIsSendingReset(false);
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
                  <strong>Live</strong>
                  <span>shared boss timers</span>
                </div>
                <div>
                  <strong>Admin</strong>
                  <span>users and bosses</span>
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

              {!showForgotPassword ? (
                <form onSubmit={handleSubmit} id="login-form">
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}

                  <div className="form-floating mb-3">
                    <input
                      id="loginEmail"
                      type="email"
                      className="form-control"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <label htmlFor="loginEmail">Email address</label>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      id="loginPassword"
                      type="password"
                      placeholder="Password"
                      value={password}
                      className="form-control"
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <label htmlFor="loginPassword">Password</label>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        value=""
                        id="rememberLogin"
                      />
                      <label className="form-check-label" htmlFor="rememberLogin">
                        Remember me
                      </label>
                    </div>
                    <button
                      type="button"
                      className="btn btn-link login-link"
                      onClick={() => {
                        setForgotEmail(email);
                        setForgotError("");
                        setForgotMessage("");
                        setShowForgotPassword(true);
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button type="submit" className="btn btn-primary w-100 login-submit" disabled={isSubmitting}>
                    {isSubmitting ? "Signing in..." : "Sign in"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleForgotPassword} id="forgot-password-form">
                  <h3 className="h5 mb-2">Reset your password</h3>
                  <p className="text-muted mb-4">
                    Enter your email and we will send reset instructions if the account exists.
                  </p>

                  {forgotMessage && (
                    <div className="alert alert-success" role="alert">
                      {forgotMessage}
                    </div>
                  )}

                  {forgotError && (
                    <div className="alert alert-danger" role="alert">
                      {forgotError}
                    </div>
                  )}

                  <div className="form-floating mb-3">
                    <input
                      id="forgotEmail"
                      type="email"
                      className="form-control"
                      placeholder="name@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                    <label htmlFor="forgotEmail">Email address</label>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 login-submit"
                    disabled={isSendingReset}
                  >
                    {isSendingReset ? "Sending..." : "Send reset instructions"}
                  </button>

                  <button
                    type="button"
                    className="btn btn-link login-link w-100 mt-3"
                    onClick={() => setShowForgotPassword(false)}
                  >
                    Back to sign in
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;
