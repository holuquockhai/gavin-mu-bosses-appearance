import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useSelector } from "react-redux";
import LeftHiddenNavigation from "./LeftHiddenNavigation";
import RightHiddenNavigation from "./RightHiddenNavigation";
import AdminLeftNavigation from "../admin/components/AdminLeftNavigation";
import { logout } from "../../utils/auth";
import { Offcanvas } from "react-bootstrap";
import logo from "../../assets/logo.png";

function TopNavigation({ isDark, setIsDark, user }) {
  const notificationCount = useSelector((state) => state.notifications.value.length);
  const displayName = user?.full_name || user?.email || "User";
  const isAdmin = user?.roles?.includes("admin");

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const [show, setShow] = useState(false);
  const [showAdminNavigation, setShowAdminNavigation] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const handleCloseAdminNavigation = () => setShowAdminNavigation(false);
  const handleShowAdminNavigation = () => setShowAdminNavigation(true);
  return (
    <>
      <nav className="navbar fixed-top sticky-top-navigation bg-body-tertiary border-bottom">
        <div className="container-fluid">
          <div className="d-flex align-items-center w-100 gap-3">
            <Link to="/" className="navbar-brand top-navigation-logo-link" aria-label="Go to landing page">
              <img src={logo} alt="MU logo" className="top-navigation-logo" />
              <span className="top-navigation-title">MU BOSS TIMER</span>
            </Link>

            {isAdmin && <AdminLeftNavigation />}
            {isAdmin && (
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm d-md-none"
                onClick={handleShowAdminNavigation}
                aria-label="Open admin navigation"
              >
                Admin
              </button>
            )}

            <div className="ms-auto d-flex align-items-center gap-2">
              <span className="small fw-semibold text-nowrap d-none d-sm-inline">{displayName}</span>
              <button onClick={handleLogout} className="btn btn-sm">
                Logout
              </button>
              <button
                type="button"
                className="btn position-relative"
                data-bs-toggle="offcanvas"
                data-bs-target="#offcanvasRight"
                aria-controls="offcanvasRight"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  className="bi bi-bell"
                  viewBox="0 0 16 16"
                >
                  <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2M8 1.918l-.797.161A4 4 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4 4 0 0 0-3.203-3.92zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5 5 0 0 1 13 6c0 .88.32 4.2 1.22 6"></path>
                </svg>
                {notificationCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger text-white">
                    {notificationCount > 99 ? "99+" : notificationCount}
                    <span className="visually-hidden">notifications</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>
      <button
        className="btn btn-primary floating-settings-button"
        type="button"
        onClick={handleShow}
        aria-label="Open settings menu"
        title="Settings"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="currentColor"
          className="bi bi-gear"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492ZM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0Z" />
          <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.434.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.893 1.64.902 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.434-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319Zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.292-.16c.764-.416 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.318.094a1.873 1.873 0 0 0-1.116 2.693l.16.292c.416.764-.42 1.6-1.185 1.184l-.292-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.318a1.873 1.873 0 0 0-2.692-1.116l-.292.16c-.765.416-1.601-.42-1.185-1.185l.16-.292a1.873 1.873 0 0 0-1.116-2.693l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.416-.765.42-1.601 1.185-1.185l.292.16A1.873 1.873 0 0 0 7.07 1.945l.094-.319Z" />
        </svg>
      </button>
      <LeftHiddenNavigation
        isDark={isDark}
        setIsDark={setIsDark}
        user={user}
        isShow={show}
        handleClose={handleClose}
      />

      {isAdmin && (
        <Offcanvas
          show={showAdminNavigation}
          onHide={handleCloseAdminNavigation}
          placement="start"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>Administration</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <AdminLeftNavigation mobile onNavigate={handleCloseAdminNavigation} />
          </Offcanvas.Body>
        </Offcanvas>
      )}

      <RightHiddenNavigation />
    </>
  );
}

export default TopNavigation;
