import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { getBossesApi } from "../api/bossApi";
import { getChannelsApi } from "../api/channelApi";
import { getNotificationsApi } from "../api/notificationApi";
import { API_URL } from "../api/config";
import { getBossTimerStateApi } from "../api/timerApi";
import { setBosses } from "../js/bossSlice";
import { setChannels } from "../js/channelSlice";
import { setNotifications } from "../js/notificationSlice";
import { setBossTimerState } from "../js/timerSlice";
import { getToken, getUser, logout } from "../utils/auth";
import { playAlertTone } from "../utils/sound";

const getRealtimeUrl = () => {
  if (API_URL.startsWith("http://")) {
    return `${API_URL.replace("http://", "ws://").replace(/\/api$/, "")}/ws/realtime`;
  }

  if (API_URL.startsWith("https://")) {
    return `${API_URL.replace("https://", "wss://").replace(/\/api$/, "")}/ws/realtime`;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/realtime`;
};

const emitConnectionStatus = (status, message = "") => {
  window.dispatchEvent(new CustomEvent("warlords:connection-status", {
    detail: { status, message },
  }));
};

export function useRealtimeSync() {
  const dispatch = useDispatch();
  const soundEnabled = useSelector((state) => state.systemSettings.soundEnabled);
  const soundStyle = useSelector((state) => state.systemSettings.soundStyle);

  useEffect(() => {
    let socket;
    let reconnectTimerId;
    let refreshTimerId;
    let heartbeatTimerId;
    let heartbeatTimeoutId;
    let isClosed = false;
    const pendingRefresh = {
      timers: false,
      notifications: false,
      bosses: false,
      channels: false,
    };

    const refreshState = ({ timers = false, notifications = false, bosses = false, channels = false } = {}) => {
      pendingRefresh.timers = pendingRefresh.timers || timers;
      pendingRefresh.notifications = pendingRefresh.notifications || notifications;
      pendingRefresh.bosses = pendingRefresh.bosses || bosses;
      pendingRefresh.channels = pendingRefresh.channels || channels;

      window.clearTimeout(refreshTimerId);
      refreshTimerId = window.setTimeout(() => {
        const refresh = { ...pendingRefresh };
        pendingRefresh.timers = false;
        pendingRefresh.notifications = false;
        pendingRefresh.bosses = false;
        pendingRefresh.channels = false;

        if (refresh.bosses) {
          getBossesApi()
            .then((data) => dispatch(setBosses(data)))
            .catch(() => {});
        }

        if (refresh.channels) {
          getChannelsApi()
            .then((data) => dispatch(setChannels(data)))
            .catch(() => {});
        }

        if (refresh.timers) {
          getBossTimerStateApi()
            .then((data) => {
              dispatch(setBossTimerState(data));
              window.dispatchEvent(new Event("warlords:timer-list-refresh"));
            })
            .catch(() => {});
        }

        if (refresh.notifications) {
          getNotificationsApi()
            .then((data) => dispatch(setNotifications(data)))
            .catch(() => {});
        }
      }, 150);
    };

    const clearHeartbeat = () => {
      window.clearInterval(heartbeatTimerId);
      window.clearTimeout(heartbeatTimeoutId);
    };

    const startHeartbeat = () => {
      clearHeartbeat();

      heartbeatTimerId = window.setInterval(() => {
        if (!socket || socket.readyState !== WebSocket.OPEN || !navigator.onLine) {
          emitConnectionStatus(
            navigator.onLine ? "reconnecting" : "offline",
            "Loading website data...",
          );
          socket?.close();
          return;
        }

        try {
          socket.send(JSON.stringify({ type: "ping" }));
          window.clearTimeout(heartbeatTimeoutId);
          heartbeatTimeoutId = window.setTimeout(() => {
            emitConnectionStatus("reconnecting", "Loading website data...");
            socket?.close();
          }, 8000);
        } catch {
          emitConnectionStatus("reconnecting", "Loading website data...");
          socket?.close();
        }
      }, 5000);
    };

    const connect = () => {
      const token = getToken();

      if (!token) {
        return;
      }

      emitConnectionStatus(
        navigator.onLine ? "connecting" : "offline",
        "Loading website data...",
      );
      socket = new WebSocket(`${getRealtimeUrl()}?token=${encodeURIComponent(token)}`);

      socket.onopen = () => {
        if (!navigator.onLine) {
          emitConnectionStatus("offline", "Loading website data...");
          socket?.close();
          return;
        }

        emitConnectionStatus("connected");
        startHeartbeat();
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          window.clearTimeout(heartbeatTimeoutId);
          if (message.type === "pong") {
            emitConnectionStatus("connected");
            return;
          }

          if (message.type === "timer_state_updated") {
            const currentUser = getUser();
            const isRemoteAppeared =
              message.action === "appeared" && message.actor_user_id !== currentUser?.id;
            const isExpiredTimer = message.action === "expired";

            if (soundEnabled && (isRemoteAppeared || isExpiredTimer)) {
              playAlertTone(soundStyle);
            }

            refreshState({ timers: true, notifications: true });
          }

          if (message.type === "notifications_updated") {
            refreshState({ notifications: true });
          }

          if (message.type === "bosses_updated") {
            window.dispatchEvent(new CustomEvent("warlords:bosses-updated", { detail: message }));
            refreshState({ bosses: true });
          }

          if (message.type === "channels_updated") {
            window.dispatchEvent(new CustomEvent("warlords:channels-updated", { detail: message }));
            refreshState({ channels: true });
          }

          if (message.type === "users_updated") {
            window.dispatchEvent(new CustomEvent("warlords:users-updated", { detail: message }));
          }

          if (message.type === "logs_updated" || message.type === "email_logs_updated" || message.type === "cron_logs_updated") {
            window.dispatchEvent(new CustomEvent("warlords:logs-updated", { detail: message }));
          }

          if (message.type === "online_users_updated") {
            window.dispatchEvent(new CustomEvent("warlords:online-users-updated", { detail: message.users || [] }));
          }

          if (message.type === "chat_message_created") {
            window.dispatchEvent(new CustomEvent("warlords:chat-message-created", { detail: message }));
          }

          if (message.type === "chat_user_left") {
            window.dispatchEvent(new CustomEvent("warlords:chat-user-left", { detail: message }));
          }

          if (message.type === "chat_user_joined") {
            window.dispatchEvent(new CustomEvent("warlords:chat-user-joined", { detail: message }));
          }

          if (message.type === "factory_reset_completed") {
            isClosed = true;
            socket?.close();
            logout();
            window.location.replace("/login");
          }
        } catch {
          // Ignore malformed realtime messages.
        }
      };

      socket.onclose = () => {
        clearHeartbeat();
        if (!isClosed) {
          emitConnectionStatus(
            navigator.onLine ? "reconnecting" : "offline",
            "Loading website data...",
          );
          reconnectTimerId = window.setTimeout(connect, 3000);
        }
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    connect();

    const handleBrowserOnline = () => {
      if (!isClosed) {
        emitConnectionStatus("reconnecting", "Loading website data...");
        socket?.close();
      }
    };

    const handleBrowserOffline = () => {
      emitConnectionStatus("offline", "Loading website data...");
      socket?.close();
    };

    window.addEventListener("online", handleBrowserOnline);
    window.addEventListener("offline", handleBrowserOffline);

    return () => {
      isClosed = true;
      clearHeartbeat();
      window.clearTimeout(reconnectTimerId);
      window.clearTimeout(refreshTimerId);
      window.removeEventListener("online", handleBrowserOnline);
      window.removeEventListener("offline", handleBrowserOffline);
      socket?.close();
    };
  }, [dispatch, soundEnabled, soundStyle]);
}
