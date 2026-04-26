import axios from "axios";
import { getToken } from "../utils/auth";

const API_URL = "http://127.0.0.1:8000";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

export const getNotificationsApi = async () => {
  const response = await axios.get(`${API_URL}/notifications/`, {
    headers: authHeaders(),
  });

  return response.data;
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
