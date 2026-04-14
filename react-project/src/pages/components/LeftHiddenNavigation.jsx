import { Link } from "react-router-dom";
import { Button, Offcanvas } from "react-bootstrap";
import { useState } from "react";

function LeftHiddenNavigation({
  isDark,
  setIsDark,
  user,
  isShow,
  handleClose,
}) {
  return (
    <>
      <Offcanvas show={isShow} onHide={handleClose} placement="start">
        <Offcanvas.Header>
          <h5 className="offcanvas-title" id="offcanvasLeftLabel">
            Settings
          </h5>
          <button
            type="button"
            className="btn-close"
            onClick={handleClose}
            aria-label="Close"
          ></button>
        </Offcanvas.Header>

        <hr className="my-1" />
        <Offcanvas.Body>
          <h6 className="lef-nav-sub-title">System Setting</h6>
          <hr className="my-1" />
          <div>
            Setup your theme Dark Mode or Light Mode, sound and notification
          </div>
          <div className="dropdown mt-3">
            <div className="form-check form-switch pe-4">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="switchCheckDarkMode"
                checked={isDark}
                onChange={(e) => setIsDark(e.target.checked)}
              />

              <label
                className="small form-check-label"
                htmlFor="switchCheckDarkMode"
              >
                Dark mode
              </label>
            </div>

            <div className="form-check form-switch pe-4">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="switchCheckSound"
              />
              <label
                className="small form-check-label"
                htmlFor="switchCheckSound"
              >
                Sound
              </label>
            </div>

            <select
              className="select form-select mt-3"
              id="soundStyle"
              title="Alert tone"
            >
              <option value="chime">Chime</option>
              <option value="bell">Bell</option>
              <option value="beep">Beep</option>
              <option value="retro">Retro</option>
            </select>
          </div>

          {user?.roles?.includes("admin") && (
            <>
              <h6 className="lef-nav-sub-title">Administration</h6>
              <hr className="my-1" />
              <ul className="navbar-nav justify-content-end flex-grow-1 pe-3">
                <li className="nav-item">
                  <Link to="/">Users</Link>
                </li>

                <li className="nav-item">
                  <Link to="/admin/create-boss" className="nav-link active">
                    Bosses
                  </Link>
                </li>

                <li className="nav-item">
                  <Link to="/">Channels</Link>
                </li>
              </ul>
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}

export default LeftHiddenNavigation;
