import axios from "axios";
import { API_URL } from "./config";
import { getToken } from "../utils/auth";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

export const getChatMessagesApi = async ({ limit = 50, beforeId } = {}) => {
  const response = await axios.get(`${API_URL}/chat/messages`, {
    params: {
      limit,
      before_id: beforeId || undefined,
      _: Date.now(),
    },
    headers: authHeaders(),
  });

  return response.data;
};

export const createChatMessageApi = async (message) => {
  const response = await axios.post(`${API_URL}/chat/messages`, { message }, {
    headers: authHeaders(),
  });

  return response.data;
};

export const updateChatMessageApi = async (messageId, message) => {
  const response = await axios.put(`${API_URL}/chat/messages/${messageId}`, { message }, {
    headers: authHeaders(),
  });

  return response.data;
};

export const unsendChatMessageApi = async (messageId) => {
  const response = await axios.delete(`${API_URL}/chat/messages/${messageId}`, {
    headers: authHeaders(),
  });

  return response.data;
};
