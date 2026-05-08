import axios from "axios";
import { getToken } from "../utils/auth";

const API_URL = "http://127.0.0.1:8000";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

export const getSystemSettingsApi = async () => {
  const response = await axios.get(`${API_URL}/system-settings/`, {
    headers: authHeaders(),
  });

  return response.data;
};

export const getPublicBrandingApi = async () => {
  const response = await axios.get(`${API_URL}/system-settings/branding`);

  return response.data;
};

export const getPublicMaintenanceApi = async () => {
  const response = await axios.get(`${API_URL}/system-settings/maintenance`);

  return response.data;
};

export const updateSystemSettingsApi = async (payload) => {
  const response = await axios.put(`${API_URL}/system-settings/`, payload, {
    headers: authHeaders(),
  });

  return response.data;
};

export const updateBrandingSettingsApi = async (payload) => {
  const formData = new FormData();

  if (payload.site_head_title !== undefined) {
    formData.append("site_head_title", payload.site_head_title);
  }

  if (payload.site_logo) {
    formData.append("site_logo", payload.site_logo);
  }

  if (payload.site_sublogo) {
    formData.append("site_sublogo", payload.site_sublogo);
  }

  const response = await axios.put(`${API_URL}/system-settings/branding`, formData, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  return response.data;
};

export const sendSystemSettingsTestEmailApi = async (recipient) => {
  const response = await axios.post(`${API_URL}/system-settings/test-email`, null, {
    params: { recipient },
    headers: authHeaders(),
  });

  return response.data;
};
