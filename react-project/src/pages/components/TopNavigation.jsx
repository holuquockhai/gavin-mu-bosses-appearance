import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useSelector } from "react-redux";
import LeftHiddenNavigation from "./LeftHiddenNavigation";
import RightHiddenNavigation from "./RightHiddenNavigation";
import AdminLeftNavigation from "../admin/components/AdminLeftNavigation";
import { logout } from "../../utils/auth";
import { Offcanvas } from "react-bootstrap";
import logo from "../../assets/logo.png";
import siteName from "../../assets/site_name.png";

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
              <img src={siteName} alt="" className="top-navigation-site-name" aria-hidden="true" />
              <span className="visually-hidden">MU BOSS TIMER</span>
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
                className="btn position-relative top-navigation-notification-button"
                data-bs-toggle="offcanvas"
                data-bs-target="#offcanvasRight"
                aria-controls="offcanvasRight"
                aria-label="Open notifications"
              >
                <i className="bi bi-bell" aria-hidden="true"></i>
                {notificationCount > 0 && (
                  <span className="position-absolute badge rounded-pill bg-danger text-white top-navigation-notification-badge">
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
        className="btn floating-settings-button"
        type="button"
        onClick={handleShow}
        aria-label="Open settings menu"
        title="Settings"
      >
        <i className="bi bi-gear" aria-hidden="true"></i>
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
