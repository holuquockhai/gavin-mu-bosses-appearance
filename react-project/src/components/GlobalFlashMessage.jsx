import { useEffect, useState } from "react";

function GlobalFlashMessage() {
  const [flashMessage, setFlashMessage] = useState(null);

  useEffect(() => {
    const handleFlashMessage = (event) => {
      setFlashMessage(event.detail);
    };

    window.addEventListener("warlords:flash-message", handleFlashMessage);
    return () => window.removeEventListener("warlords:flash-message", handleFlashMessage);
  }, []);

  useEffect(() => {
    if (!flashMessage?.duration) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setFlashMessage(null), flashMessage.duration);
    return () => window.clearTimeout(timeoutId);
  }, [flashMessage]);

  if (!flashMessage) {
    return null;
  }

  return (
    <div className="global-flash-message">
      <div
        key={flashMessage.id}
        className={`alert alert-${flashMessage.variant || "success"} alert-dismissible fade show shadow-sm mb-0`}
        role="alert"
      >
        {flashMessage.message}
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          onClick={() => setFlashMessage(null)}
        ></button>
      </div>
    </div>
  );
}

export default GlobalFlashMessage;
