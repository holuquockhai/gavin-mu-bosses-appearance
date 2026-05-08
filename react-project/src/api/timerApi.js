import axios from "axios";
import { API_URL } from "./config";
import { getToken } from "../utils/auth";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

export const getBossTimerStateApi = async () => {
  const response = await axios.get(`${API_URL}/boss-timers/`, {
    headers: authHeaders(),
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
