function ConnectionOverlay({ status, message }) {
  if (status === "connected") {
    return null;
  }

  const title = "Loading...";
  const description = message || (
    status === "offline"
      ? "Please wait while we check your connection."
      : "Please wait while we load the latest website data."
  );

  return (
    <div className="connection-overlay" role="alert" aria-live="assertive" aria-busy="true">
      <div className="connection-panel">
        <div className="connection-orbit" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <h2 className="h5 mb-2">{title}</h2>
        <p className="text-muted mb-0">{description}</p>
      </div>
    </div>
  );
}

export default ConnectionOverlay;
