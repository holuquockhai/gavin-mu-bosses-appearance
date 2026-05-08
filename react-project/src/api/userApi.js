import axios from "axios";
import { API_URL } from "./config";
import { getToken } from "../utils/auth";

export const USER_API_URL = API_URL;

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

export const getCurrentUserApi = async () => {
  const response = await axios.get(`${API_URL}/users/me`, {
    headers: authHeaders(),
  });

  return response.data;
};

export const getUserProfileApi = async (userId) => {
  const response = await axios.get(`${API_URL}/users/profile/${userId}`, {
    headers: authHeaders(),
  });

  return response.data;
};

export const updateProfileApi = async (payload) => {
  const formData = new FormData();

  if (payload.full_name !== undefined) {
    formData.append("full_name", payload.full_name);
  }

  if (payload.phone_number !== undefined) {
    formData.append("phone_number", payload.phone_number);
  }

  if (payload.country !== undefined) {
    formData.append("country", payload.country);
  }

  if (payload.bio !== undefined) {
    formData.append("bio", payload.bio);
  }

  if (payload.password) {
    formData.append("password", payload.password);
  }

  if (payload.avatar) {
    formData.append("avatar", payload.avatar);
  }

  const response = await axios.put(`${API_URL}/users/me/profile`, formData, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
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
