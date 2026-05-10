import { useEffect, useMemo, useState } from "react";

const getInitialStatus = () => (
  navigator.onLine
    ? { status: "connecting", message: "Loading website data..." }
    : { status: "offline", message: "Loading website data..." }
);

export function useConnectionStatus() {
  const [connection, setConnection] = useState(getInitialStatus);

  useEffect(() => {
    const handleConnectionStatus = (event) => {
      setConnection({
        status: event.detail?.status || "reconnecting",
        message: event.detail?.message || "",
      });
    };

    const handleOnline = () => {
      setConnection({
        status: "reconnecting",
        message: "Loading website data...",
      });
    };

    const handleOffline = () => {
      setConnection({
        status: "offline",
        message: "Loading website data...",
      });
    };

    window.addEventListener("warlords:connection-status", handleConnectionStatus);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("warlords:connection-status", handleConnectionStatus);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return useMemo(() => ({
    ...connection,
    isBlocked: connection.status !== "connected",
  }), [connection]);
}
