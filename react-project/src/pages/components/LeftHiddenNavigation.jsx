function LeftHiddenNavigation({ isDark, setIsDark }) {
  return (
    <>
      <div
        className="offcanvas offcanvas-start"
        tabIndex="-1"
        id="offcanvasExample"
        aria-labelledby="offcanvasExampleLabel"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="offcanvasExampleLabel">
            Settings
          </h5>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          ></button>
        </div>
        <hr className="my-1" />
        <div className="offcanvas-body">
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
        </div>
      </div>
    </>
  );
}

export default LeftHiddenNavigation;
