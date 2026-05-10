import axios from "axios";
import { API_URL } from "./config";
import { getToken } from "../utils/auth";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

export const getBossTimerStateApi = async () => {
  const response = await axios.get(`${API_URL}/boss-timers/`, {
    params: { _: Date.now() },
    headers: {
      ...authHeaders(),
      "Cache-Control": "no-cache",
    },
  });

  return response.data;
};

export const getComingSoonBossTimersApi = async ({ offset = 0, limit = 8 } = {}) => {
  const response = await axios.get(`${API_URL}/boss-timers/coming-soon`, {
    params: { offset, limit, _: Date.now() },
    headers: {
      ...authHeaders(),
      "Cache-Control": "no-cache",
    },
  });

  return response.data;
};

export const getBossHistoryApi = async ({ offset = 0, limit = 5 } = {}) => {
  const response = await axios.get(`${API_URL}/boss-timers/history`, {
    params: { offset, limit, _: Date.now() },
    headers: {
      ...authHeaders(),
      "Cache-Control": "no-cache",
    },
  });

  return response.data;
};

export const createBossTimerApi = async (payload) => {
  const response = await axios.post(`${API_URL}/boss-timers/`, payload, {
    headers: authHeaders(),
  });

  return response.data;
};

export const clearBossTimerApi = async ({ bossId, channel }) => {
  const response = await axios.delete(`${API_URL}/boss-timers/`, {
    headers: authHeaders(),
    params: {
      boss_id: bossId,
      channel,
    },
  });

  return response.data;
};

export const markBossAppearedApi = async (payload) => {
  const response = await axios.post(`${API_URL}/boss-timers/appeared`, payload, {
    headers: authHeaders(),
  });

  return response.data;
};

export const completeExpiredBossTimersApi = async () => {
  const response = await axios.post(`${API_URL}/boss-timers/complete-expired`, {}, {
    headers: authHeaders(),
  });

  return response.data;
};
