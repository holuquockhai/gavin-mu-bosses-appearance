import { useState } from "react";
import { useNavigate, Navigate, useLocation } from "react-router-dom";
import { loginUser } from "../api/auth";
import background from "../assets/images/bg/login_bg1.png";
import "../scss/login_page.scss";
import { saveAuth } from "../utils/auth";

const Login = () => {
  const token = localStorage.getItem("access_token");
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const from = location.state?.from?.pathname || "/";

  if (token) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = await loginUser(email, password);

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("token_type", data.token_type);

      localStorage.setItem("access_token", res.data.access_token);
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Login failed. Please check your credentials.",
      );
    }
  };

  const root = document.getElementById("root");
  root.classList.add("login-page");

  return (
    <>
      <section className="vh-100">
        <div className="container py-5 h-100 ">
          <div className="row d-flex align-items-center justify-content-center h-100 wrapper">
            {/* <div className="col-md-8 col-lg-7 col-xl-6 left-image">
              <img src={background} className="img-fluid" alt="Phone image" />
            </div> */}

            <div className="col-md-7 col-lg-5 col-xl-5 login-form-wrapper p-3 rounded-5">
              <form onSubmit={handleSubmit} id="login-form">
                <h2>Welcome back</h2>

                {error && (
                  <p>
                    <code className="error-message">{error}</code>
                  </p>
                )}

                <div data-mdb-input-init className="form-group mb-4">
                  <input
                    type="email"
                    id="form1Example13"
                    className="form-control"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div data-mdb-input-init className="form-group mb-4">
                  <input
                    type="password"
                    id="form1Example23"
                    placeholder="Password"
                    value={password}
                    className="form-control"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="d-flex justify-content-around align-items-center mb-4">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      value=""
                      id="form1Example3"
                    />
                    <label className="form-check-label" htmlFor="form1Example3">
                      {" "}
                      Remember me{" "}
                    </label>
                  </div>
                  <a href="#!">Forgot password?</a>
                </div>

                <button
                  type="submit"
                  data-mdb-button-init
                  data-mdb-ripple-init
                  className="btn btn-primary btn-block"
                >
                  Sign in
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Login;
