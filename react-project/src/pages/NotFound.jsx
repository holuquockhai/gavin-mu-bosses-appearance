import { Link } from "react-router-dom";
import { useEffect } from "react";
import logo from "../assets/logo.png";
import { isAuthenticated } from "../utils/auth";

function NotFound() {
  const hasSession = isAuthenticated();

  useEffect(() => {
    document.title = "404 - Page Not Found";
  }, []);

  return (
    <main className="container py-5">
      <div className="card border-0 shadow-sm mx-auto text-center" style={{ maxWidth: "620px" }}>
        <div className="card-body p-4 p-md-5">
          <img src={logo} alt="Warlords logo" className="mb-4" style={{ width: "96px", height: "96px", objectFit: "contain" }} />
          <h1 className="display-4 fw-bold mb-2">404</h1>
          <p className="h4 mb-3">Page Not Found</p>
          <p className="text-muted mb-4">
            The page you are looking for does not exist or may have been moved.
          </p>
          <Link to={hasSession ? "/" : "/login"} className="btn btn-outline-success">
            {hasSession ? "Back to Home" : "Back to Login"}
          </Link>
        </div>
      </div>
    </main>
  );
}

export default NotFound;
