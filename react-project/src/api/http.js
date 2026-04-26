import axios from "axios";
import { logout } from "../utils/auth";

let isRedirectingToLogin = false;

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;

    if (status === 401 && detail === "Could not validate credentials" && !isRedirectingToLogin) {
      isRedirectingToLogin = true;
      logout();
      window.location.replace("/login");
    }

    return Promise.reject(error);
  },
);

