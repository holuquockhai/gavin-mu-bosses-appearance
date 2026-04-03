// src/utils/auth.jsx
export const isAuthenticated = () => {
  return localStorage.getItem("token") !== null;
};