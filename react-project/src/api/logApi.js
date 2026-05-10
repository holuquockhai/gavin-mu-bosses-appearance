import axios from "axios";
import { API_URL } from "./config";
import { getToken } from "../utils/auth";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const cleanParams = (params) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
);

export const getActivityLogsApi = async ({ page = 1, pageSize = 25, filters = {} } = {}) => {
  const response = await axios.get(`${API_URL}/admin/logs/activities`, {
    params: cleanParams({ page, page_size: pageSize, ...filters }),
    headers: authHeaders(),
  });

  return response.data;
};

export const getEmailLogsApi = async ({ page = 1, pageSize = 25, filters = {} } = {}) => {
  const response = await axios.get(`${API_URL}/admin/logs/emails`, {
    params: cleanParams({ page, page_size: pageSize, ...filters }),
    headers: authHeaders(),
  });

  return response.data;
};

export const getCronJobLogsApi = async ({ page = 1, pageSize = 25, filters = {} } = {}) => {
  const response = await axios.get(`${API_URL}/admin/logs/cronjobs`, {
    params: cleanParams({ page, page_size: pageSize, ...filters }),
    headers: authHeaders(),
  });

  return response.data;
};

export const getSystemSettingLogsApi = async ({ page = 1, pageSize = 25, filters = {} } = {}) => {
  const response = await axios.get(`${API_URL}/admin/logs/system-settings`, {
    params: cleanParams({ page, page_size: pageSize, ...filters }),
    headers: authHeaders(),
  });

  return response.data;
};

export const getLogFilterOptionsApi = async () => {
  const response = await axios.get(`${API_URL}/admin/logs/filter-options`, {
    headers: authHeaders(),
  });

  return response.data;
};

export const sendEmailLogNowApi = async (emailId) => {
  const response = await axios.post(`${API_URL}/admin/logs/emails/${emailId}/send`, null, {
    headers: authHeaders(),
  });

  return response.data;
};
