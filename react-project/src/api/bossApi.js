import axios from "axios";
import { getToken } from "../utils/auth";

const API_URL = "http://127.0.0.1:8000";

export const createBossApi = async (payload) => {
  const response = await axios.post(`${API_URL}/bosses`, payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });

  return response.data;
};