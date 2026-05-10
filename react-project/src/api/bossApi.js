import axios from "axios";
import { API_URL } from "./config";
import { getToken } from "../utils/auth";

export const createBossApi = async (payload) => {
  const response = await axios.post(`${API_URL}/bosses/`, payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });

  return response.data;
};

// export const getBossesApi = async (payload) => {
//   const response = await axios.get(`${API_URL}/bosses`, payload, {
//     headers: {
//       Authorization: `Bearer ${getToken()}`,
//     },
//   });

//   return response.data;
// }

export const getBossesApi = async () => {
  const response = await axios.get(`${API_URL}/bosses/`, {
    params: { _: Date.now() },
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      Authorization: `Bearer ${getToken()}`,
    },
  });

  return response.data;
};

export const deleteBossApi = async (bossId) => {
  const response = await axios.delete(`${API_URL}/bosses/${bossId}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });

  return response.data;
};

export const updateBossApi = async (bossId, payload) => {
  const response = await axios.put(`${API_URL}/bosses/${bossId}`, payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });

  return response.data;
};

// const fetchData = async () => {
//   const response = await axios.get(API_URL, {
//     headers: {
//       'Authorization': `Bearer ${getToken()}`
//     }
//   });
//   return response.data;  
// };
