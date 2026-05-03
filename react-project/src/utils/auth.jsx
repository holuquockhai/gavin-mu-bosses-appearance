const AUTH_KEYS = ["access_token", "token_type", "user"];

const clearAuthStorage = (storage) => {
  AUTH_KEYS.forEach((key) => storage.removeItem(key));
};

export const saveAuth = (data) => {
  clearAuthStorage(localStorage);
  sessionStorage.setItem("access_token", data.access_token);
  sessionStorage.setItem("token_type", data.token_type || "bearer");

  if (data.user) {
    sessionStorage.setItem("user", JSON.stringify(data.user));
  } else {
    sessionStorage.removeItem("user");
  }
};

export const getToken = () => sessionStorage.getItem("access_token");

export const getUser = () => {
  const raw = sessionStorage.getItem("user");

  if (!raw || raw === "undefined" || raw === "null") {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error("Invalid user JSON:", raw);
    sessionStorage.removeItem("user");
    return null;
  }
};

export const isAuthenticated = () => !!getToken();

export const isAdmin = () => {
  const user = getUser();

  // support roles array
  return user?.roles?.includes("admin");
};

export const logout = () => {
  clearAuthStorage(sessionStorage);
  clearAuthStorage(localStorage);
};
