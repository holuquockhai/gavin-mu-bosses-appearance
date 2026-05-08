import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getPublicMaintenanceApi } from "../api/systemSettingsApi";
import { isAdmin, isAuthenticated, logout } from "../utils/auth";

const DEFAULT_MAINTENANCE_MESSAGE = "Wardlords Site is currently under maintenance. Please check back shortly.";

const renderMaintenanceMessage = (message) => {
  const text = message || DEFAULT_MAINTENANCE_MESSAGE;
  const siteName = text.includes("Wardlords Site") ? "Wardlords Site" : "Warlords Site";
  const siteNameIndex = text.indexOf(siteName);

  if (siteNameIndex === -1) {
    return text;
  }

  return (
    <>
      {text.slice(0, siteNameIndex)}
      <strong>{siteName}</strong>
      {text.slice(siteNameIndex + siteName.length)}
    </>
  );
};

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [maintenance, setMaintenance] = useState({
    isLoading: true,
    enabled: false,
    message: "",
  });

  useEffect(() => {
    getPublicMaintenanceApi()
      .then((data) => {
        setMaintenance({
          isLoading: false,
          enabled: Boolean(data.maintenance_enabled),
          message: data.maintenance_message || "",
        });
      })
      .catch(() => {
        setMaintenance({
          isLoading: false,
          enabled: false,
          message: "",
        });
      });
  }, []);

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  if (maintenance.isLoading) {
    return (
      <div className="container py-5">
        <p className="small text-muted mb-0">Loading...</p>
      </div>
    );
  }

  if (maintenance.enabled && !isAdmin()) {
    return (
      <main className="container py-5">
        <div className="card border-0 shadow-sm mx-auto" style={{ maxWidth: "560px" }}>
          <div className="card-body p-4 text-center">
            <i className="bi bi-tools fs-1 text-warning" aria-hidden="true"></i>
            <h1 className="h4 mt-3 mb-2">Maintenance Mode</h1>
            <p className="text-muted mb-0">
              {renderMaintenanceMessage(maintenance.message)}
            </p>
            <button type="button" className="btn btn-outline-secondary btn-sm mt-4" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </main>
    );
  }

  return children ? children : <Outlet />;
}
