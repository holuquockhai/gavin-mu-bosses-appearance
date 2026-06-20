import { createSlice } from "@reduxjs/toolkit";
import { getApiDateTime } from "../utils/dateTime";

const createNotification = (type, payload) => ({
  id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type,
  ...payload,
  createdAt: Date.now(),
});

export const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    value: [],
    totalCount: 0,
    pageSize: Number(localStorage.getItem("notificationPageSize")) || 5,
  },
  reducers: {
    setNotifications: (state, action) => {
      const notifications = Array.isArray(action.payload) ? action.payload : action.payload.items;
      state.totalCount = Number(action.payload.total ?? notifications.length);
      state.value = notifications.map((notification) => ({
        id: notification.id,
        type: notification.type,
        ...notification.payload,
        createdAt: getApiDateTime(notification.created_at),
        userId: notification.user_id,
        user: notification.user
          ? {
              id: notification.user.id,
              fullName: notification.user.full_name,
              bio: notification.user.bio,
              avatarUrl: notification.user.avatar_url,
            }
          : null,
      }));
    },
    setNotificationPageSize: (state, action) => {
      state.pageSize = Number(action.payload);
      localStorage.setItem("notificationPageSize", String(state.pageSize));
    },
    addUserCreatedNotification: (state, action) => {
      const { actorName, userName } = action.payload;
      state.value.unshift(createNotification("user-created", {
        actorName,
        userName,
        message: `${actorName} created user ${userName}.`,
      }));
      state.totalCount += 1;
    },
    addBossCreatedNotification: (state, action) => {
      const { actorName, bossName } = action.payload;
      state.value.unshift(createNotification("boss-created", {
        actorName,
        bossName,
        message: `${actorName} created boss ${bossName}.`,
      }));
      state.totalCount += 1;
    },
    addBossTimerSetNotification: (state, action) => {
      const { actorName, bossName, channel, period } = action.payload;
      state.value.unshift(createNotification("boss-timer-set", {
        actorName,
        bossName,
        channel,
        period,
      }));
      state.totalCount += 1;
    },
    addBossAppearedNotification: (state, action) => {
      const { actorName, bossName, channel } = action.payload;
      state.value.unshift(createNotification("boss-appeared", {
        actorName,
        bossName,
        channel,
      }));
      state.totalCount += 1;
    },
    removeNotification: (state, action) => {
      state.value = state.value.filter((notification) => notification.id !== action.payload);
      state.totalCount = Math.max(0, state.totalCount - 1);
    },
    clearNotifications: (state) => {
      state.value = [];
      state.totalCount = 0;
    },
  },
});

export const {
  addUserCreatedNotification,
  addBossCreatedNotification,
  addBossTimerSetNotification,
  addBossAppearedNotification,
  setNotifications,
  setNotificationPageSize,
  removeNotification,
  clearNotifications,
} = notificationSlice.actions;
