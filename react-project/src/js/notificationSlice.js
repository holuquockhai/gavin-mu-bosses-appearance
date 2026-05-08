import { createSlice } from "@reduxjs/toolkit";

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
    pageSize: Number(localStorage.getItem("notificationPageSize")) || 5,
  },
  reducers: {
    setNotifications: (state, action) => {
      state.value = action.payload.map((notification) => ({
        id: notification.id,
        type: notification.type,
        ...notification.payload,
        createdAt: new Date(notification.created_at).getTime(),
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
    },
    addBossCreatedNotification: (state, action) => {
      const { actorName, bossName } = action.payload;
      state.value.unshift(createNotification("boss-created", {
        actorName,
        bossName,
        message: `${actorName} created boss ${bossName}.`,
      }));
    },
    addBossTimerSetNotification: (state, action) => {
      const { actorName, bossName, channel, period } = action.payload;
      state.value.unshift(createNotification("boss-timer-set", {
        actorName,
        bossName,
        channel,
        period,
      }));
    },
    addBossAppearedNotification: (state, action) => {
      const { actorName, bossName, channel } = action.payload;
      state.value.unshift(createNotification("boss-appeared", {
        actorName,
        bossName,
        channel,
      }));
    },
    removeNotification: (state, action) => {
      state.value = state.value.filter((notification) => notification.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.value = [];
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
