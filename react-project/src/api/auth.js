import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export const loginUser = async (email, password) => {
  const response = await API.post(
    "/auth/login",
    {
      email,
      password,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await API.post(
    "/auth/forgot-password",
    {
      email,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

export const resetPassword = async (token, password) => {
  const response = await API.post(
    "/auth/reset-password",
    {
      token,
      password,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

export const validateResetPasswordToken = async (token) => {
  const response = await API.get("/auth/reset-password/validate", {
    params: { token },
  });

  return response.data;
};

export default API;
