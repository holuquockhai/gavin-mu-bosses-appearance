import axios from "axios";
import { API_URL } from "./config";
import { getToken } from "../utils/auth";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

export const getChannelsApi = async () => {
  const response = await axios.get(`${API_URL}/channels/`, {
    params: { _: Date.now() },
    headers: {
      ...authHeaders(),
      "Cache-Control": "no-cache",
    },
  });

  return response.data;
};

export const createChannelApi = async (payload) => {
  const response = await axios.post(`${API_URL}/channels/`, payload, {
    headers: authHeaders(),
  });

  return response.data;
};

export const updateChannelApi = async (channelId, payload) => {
  const response = await axios.put(`${API_URL}/channels/${channelId}`, payload, {
    headers: authHeaders(),
  });

  return response.data;
};

export const deleteChannelApi = async (channelId) => {
  const response = await axios.delete(`${API_URL}/channels/${channelId}`, {
    headers: authHeaders(),
  });

  return response.data;
};
