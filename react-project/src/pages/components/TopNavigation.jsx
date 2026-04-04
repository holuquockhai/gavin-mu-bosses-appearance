import { useNavigate } from "react-router-dom";
import LeftHiddenNavigation from "./LeftHiddenNavigation";
import RightHiddenNavigation from "./RightHiddenNavigation";
function TopNavigation({ isDark, setIsDark }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
    navigate("/login");
  };
  return (
    <>
      <nav className="navbar fixed-top bg-body-tertiary">
        <div className="container-fluid">
          <div className="row input-group">
            {/* <a class="btn btn-primary" data-bs-toggle="offcanvas" href="#offcanvasExample" role="button" aria-controls="offcanvasExample">
                        Link with href
                        </a> */}
            <div className="col-1">
              <nav className="navbar">
                <button
                  className="navbar-toggler"
                  type="button"
                  data-bs-toggle="offcanvas"
                  data-bs-target="#offcanvasExample"
                  aria-controls="offcanvasExample"
                  aria-expanded="false"
                  aria-label="Toggle navigation"
                >
                  <span className="navbar-toggler-icon"></span>
                </button>
              </nav>
            </div>
            <div className="col-2 ms-auto mt-3">
              <button onClick={handleLogout} className="btn">
                Logout
              </button>
              <button
                type="button"
                className="btn"
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
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger text-white">
                  99+
                  <span className="visually-hidden">unread messages</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <LeftHiddenNavigation isDark={isDark} setIsDark={setIsDark} />
      <RightHiddenNavigation />
    </>
  );
}

export default TopNavigation;
