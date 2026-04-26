import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useSelector } from "react-redux";
import LeftHiddenNavigation from "./LeftHiddenNavigation";
import RightHiddenNavigation from "./RightHiddenNavigation";

function TopNavigation({ isDark, setIsDark, user }) {
  const notificationCount = useSelector((state) => state.notifications.value.length);
  const displayName = user?.full_name || user?.email || "User";
  const isAdmin = user?.roles?.includes("admin");

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
    navigate("/login");
  };

  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  return (
    <>
      <nav className="navbar fixed-top bg-body-tertiary">
        <div className="container-fluid">
          <div className="d-flex align-items-center w-100 gap-3">
            <button
              className="navbar-toggler"
              type="button"
              onClick={handleShow}
              aria-label="Open settings menu"
            >
              <span className="navbar-toggler-icon"></span>
            </button>

            {isAdmin && (
              <div className="d-none d-md-flex align-items-center gap-2">
                <Link to="/" className="nav-link px-2">
                  Home
                </Link>
                <Link to="/admin/users" className="nav-link px-2">
                  Users
                </Link>
                <Link to="/admin/create-boss" className="nav-link px-2">
                  Bosses
                </Link>
                <Link to="/admin/channels" className="nav-link px-2">
                  Channels
                </Link>
              </div>
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
      <LeftHiddenNavigation
        isDark={isDark}
        setIsDark={setIsDark}
        user={user}
        isShow={show}
        handleClose={handleClose}
      />

      <RightHiddenNavigation />
    </>
  );
}

export default TopNavigation;
