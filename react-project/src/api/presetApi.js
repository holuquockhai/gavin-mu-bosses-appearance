import axios from "axios";
import { getToken } from "../utils/auth";

const API_URL = "http://127.0.0.1:8000";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const normalizePreset = (preset) => ({
  id: preset.id,
  name: preset.name,
  channels: preset.channels || {},
});

export const getPresetsApi = async () => {
  const response = await axios.get(`${API_URL}/presets/`, {
    headers: authHeaders(),
  });

  return response.data.map(normalizePreset);
};

export const createPresetApi = async (payload) => {
  const response = await axios.post(`${API_URL}/presets/`, payload, {
    headers: authHeaders(),
  });

  return normalizePreset(response.data);
};

export const renamePresetApi = async (presetId, name) => {
  const response = await axios.put(`${API_URL}/presets/${presetId}`, { name }, {
    headers: authHeaders(),
  });

  return normalizePreset(response.data);
};

export const updatePresetApi = async (presetId, payload) => {
  const response = await axios.put(`${API_URL}/presets/${presetId}`, payload, {
    headers: authHeaders(),
  });

  return normalizePreset(response.data);
};

export const savePresetChannelApi = async (presetId, payload) => {
  const response = await axios.put(`${API_URL}/presets/${presetId}/channel`, payload, {
    headers: authHeaders(),
  });

  return normalizePreset(response.data);
};

export const deletePresetApi = async (presetId) => {
  const response = await axios.delete(`${API_URL}/presets/${presetId}`, {
    headers: authHeaders(),
  });

  return response.data;
};
