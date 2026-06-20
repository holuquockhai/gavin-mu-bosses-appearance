import axios from "axios";
import { API_URL } from "./config";
import { getToken } from "../utils/auth";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

export const getNotificationsApi = async () => {
  const [notificationsResponse, countResponse] = await Promise.all([
    axios.get(`${API_URL}/notifications/`, {
      params: { _: Date.now() },
      headers: {
        ...authHeaders(),
        "Cache-Control": "no-cache",
      },
    }),
    axios.get(`${API_URL}/notifications/count`, {
      params: { _: Date.now() },
      headers: {
        ...authHeaders(),
        "Cache-Control": "no-cache",
      },
    }),
  ]);

  return {
    items: notificationsResponse.data,
    total: countResponse.data.total,
  };
};

export const getNotificationCountApi = async () => {
  const response = await axios.get(`${API_URL}/notifications/count`, {
    params: { _: Date.now() },
    headers: {
      ...authHeaders(),
      "Cache-Control": "no-cache",
    },
  });

  return response.data.total;
};

export const createNotificationApi = async ({ type, payload, createdAt }) => {
  const response = await axios.post(`${API_URL}/notifications/`, {
    type,
    payload,
    created_at: createdAt ? new Date(createdAt).toISOString() : undefined,
  }, {
    headers: authHeaders(),
  });

  return response.data;
};

export const removeNotificationApi = async (notificationId) => {
  const response = await axios.delete(`${API_URL}/notifications/${notificationId}`, {
    headers: authHeaders(),
  });

  return response.data;
};

export const clearNotificationsApi = async () => {
  const response = await axios.delete(`${API_URL}/notifications/`, {
    headers: authHeaders(),
  });

  return response.data;
};
