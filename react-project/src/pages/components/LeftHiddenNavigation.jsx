import { Offcanvas } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { setNotificationPageSize } from "../../js/notificationSlice";
import { setSoundEnabled, setSoundStyle } from "../../js/systemSettingsSlice";

function LeftHiddenNavigation({
  isDark,
  setIsDark,
  user,
  isShow,
  handleClose,
}) {
  const dispatch = useDispatch();
  const notificationPageSize = useSelector(
    (state) => state.notifications.pageSize,
  );
  const soundEnabled = useSelector(
    (state) => state.systemSettings.soundEnabled,
  );
  const soundStyle = useSelector((state) => state.systemSettings.soundStyle);

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
            {/* <div className="form-check form-switch pe-4">
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
            </div> */}

            <div className="form-check form-switch pe-4">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="switchCheckSound"
                checked={soundEnabled}
                onChange={(event) =>
                  dispatch(setSoundEnabled(event.target.checked))
                }
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
              value={soundStyle}
              disabled={!soundEnabled}
              onChange={(event) => dispatch(setSoundStyle(event.target.value))}
            >
              <option value="chime">Chime</option>
              <option value="bell">Bell</option>
              <option value="beep">Beep</option>
              <option value="retro">Retro</option>
              <option value="alarm">Alarm</option>
            </select>

            <label
              className="small form-label mt-3"
              htmlFor="notificationPageSize"
            >
              Notifications per page
            </label>
            <select
              className="select form-select"
              id="notificationPageSize"
              value={notificationPageSize}
              onChange={(event) =>
                dispatch(setNotificationPageSize(event.target.value))
              }
            >
              <option value="3">3</option>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </select>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}

export default LeftHiddenNavigation;
