import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { getBossesApi } from "../api/bossApi";
import { getChannelsApi } from "../api/channelApi";
import { getNotificationsApi } from "../api/notificationApi";
import { API_URL } from "../api/config";
import { getBossTimerStateApi } from "../api/timerApi";
import { setBosses } from "../js/bossSlice";
import { setChannels } from "../js/channelSlice";
import { setNotifications } from "../js/notificationSlice";
import { setBossTimerState } from "../js/timerSlice";
import { logout } from "../utils/auth";

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

export function useRealtimeSync() {
  const dispatch = useDispatch();

  useEffect(() => {
    let socket;
    let reconnectTimerId;
    let refreshTimerId;
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
            .then((data) => dispatch(setBossTimerState(data)))
            .catch(() => {});
        }

        if (refresh.notifications) {
          getNotificationsApi()
            .then((data) => dispatch(setNotifications(data)))
            .catch(() => {});
        }
      }, 150);
    };

    const connect = () => {
      socket = new WebSocket(getRealtimeUrl());

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === "timer_state_updated") {
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
        if (!isClosed) {
          reconnectTimerId = window.setTimeout(connect, 3000);
        }
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    connect();

    return () => {
      isClosed = true;
      window.clearTimeout(reconnectTimerId);
      window.clearTimeout(refreshTimerId);
      socket?.close();
    };
  }, [dispatch]);
}
