import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import LeftHiddenNavigation from "./LeftHiddenNavigation";
import RightHiddenNavigation from "./RightHiddenNavigation";
import AdminLeftNavigation from "../admin/components/AdminLeftNavigation";
import { logout } from "../../utils/auth";
import { Offcanvas } from "react-bootstrap";
import logo from "../../assets/logo.png";
import siteName from "../../assets/site_name.png";
import { USER_API_URL } from "../../api/userApi";
import { getPublicBrandingApi } from "../../api/systemSettingsApi";

function resolveAvatarUrl(avatarUrl) {
  if (!avatarUrl) {
    return "";
  }

  return avatarUrl.startsWith("http") ? avatarUrl : `${USER_API_URL}${avatarUrl}`;
}

function TopNavigation({ isDark, setIsDark, user }) {
  const notificationCount = useSelector((state) => state.notifications.value.length);
  const displayName = user?.full_name || user?.email || "User";
  const isAdmin = user?.roles?.includes("admin");
  const avatarUrl = resolveAvatarUrl(user?.avatar_url);
  const [branding, setBranding] = useState({
    site_logo_url: "",
    site_sublogo_url: "",
    site_head_title: "WARLORDS",
  });

  const navigate = useNavigate();

  useEffect(() => {
    getPublicBrandingApi()
      .then((data) => {
        setBranding({
          site_logo_url: data.site_logo_url || "",
          site_sublogo_url: data.site_sublogo_url || "",
          site_head_title: data.site_head_title || "WARLORDS",
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.title = branding.site_head_title || "WARLORDS";
  }, [branding.site_head_title]);

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
  const siteLogoUrl = branding.site_logo_url ? resolveAvatarUrl(branding.site_logo_url) : logo;
  const siteSublogoUrl = branding.site_sublogo_url ? resolveAvatarUrl(branding.site_sublogo_url) : siteName;
  const headTitle = branding.site_head_title || "WARLORDS";

  return (
    <>
      <nav className="navbar fixed-top sticky-top-navigation bg-body-tertiary border-bottom">
        <div className="container-fluid">
          <div className="d-flex align-items-center w-100 gap-3">
            <Link to="/" className="navbar-brand top-navigation-logo-link" aria-label="Go to landing page">
              <img src={siteLogoUrl} alt={`${headTitle} logo`} className="top-navigation-logo" />
              {siteSublogoUrl ? (
                <img src={siteSublogoUrl} alt="" className="top-navigation-site-name" aria-hidden="true" />
              ) : (
                <span className="top-navigation-title fw-bold">{headTitle}</span>
              )}
              <span className="visually-hidden">{headTitle}</span>
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
              <Link
                to="/profile"
                className="top-navigation-profile-link text-decoration-none"
                title="Edit profile"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="top-navigation-avatar" />
                ) : (
                  <span className="top-navigation-avatar-placeholder" aria-hidden="true">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="small fw-semibold text-nowrap d-none d-sm-inline">{displayName}</span>
              </Link>
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
