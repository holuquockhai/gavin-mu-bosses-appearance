import axios from "axios";
import { getToken } from "../utils/auth";

const API_URL = "http://127.0.0.1:8000";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

export const getUsersApi = async () => {
  const response = await axios.get(`${API_URL}/users/`, {
    headers: authHeaders(),
  });

  return response.data;
};

export const createUserApi = async (payload) => {
  const response = await axios.post(`${API_URL}/users/`, payload, {
    headers: authHeaders(),
  });

  return response.data;
};

export const updateUserApi = async (userId, payload) => {
  const response = await axios.put(`${API_URL}/users/${userId}`, payload, {
    headers: authHeaders(),
  });

  return response.data;
};

export const deleteUserApi = async (userId) => {
  const response = await axios.delete(`${API_URL}/users/${userId}`, {
    headers: authHeaders(),
  });

  return response.data;
};
