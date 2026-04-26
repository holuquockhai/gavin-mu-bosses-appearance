import axios from "axios";
import { getToken } from "../utils/auth";

const API_URL = "http://127.0.0.1:8000";

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

export const getBossesApi = async (payload) => {
  const response = await axios.get(`${API_URL}/bosses/`, {
    headers: {
      "Content-Type": "application/json",
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
//   const response = await axios.get('http://127.0.0.1:8000', {
//     headers: {
//       'Authorization': `Bearer ${getToken()}`
//     }
//   });
//   return response.data;  
// };
