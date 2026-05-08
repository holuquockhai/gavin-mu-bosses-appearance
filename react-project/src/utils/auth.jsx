const AUTH_KEYS = ["access_token", "token_type", "user"];

const clearAuthStorage = (storage) => {
  AUTH_KEYS.forEach((key) => storage.removeItem(key));
};

const setSessionCookie = (key, value) => {
  document.cookie = `${key}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
};

const getSessionCookie = (key) => {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${key}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(key.length + 1));
};

const clearSessionCookie = (key) => {
  document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
};

const clearAuthCookies = () => {
  AUTH_KEYS.forEach(clearSessionCookie);
};

export const saveAuth = (data) => {
  clearAuthStorage(localStorage);
  clearAuthStorage(sessionStorage);
  setSessionCookie("access_token", data.access_token);
  setSessionCookie("token_type", data.token_type || "bearer");

  if (data.user) {
    setSessionCookie("user", JSON.stringify(data.user));
  } else {
    clearSessionCookie("user");
  }
};

export const getToken = () => getSessionCookie("access_token") || sessionStorage.getItem("access_token");

export const getUser = () => {
  const raw = getSessionCookie("user") || sessionStorage.getItem("user");

  if (!raw || raw === "undefined" || raw === "null") {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error("Invalid user JSON:", raw);
    clearSessionCookie("user");
    sessionStorage.removeItem("user");
    return null;
  }
};

export const updateStoredUser = (user) => {
  setSessionCookie("user", JSON.stringify(user));
  window.dispatchEvent(new CustomEvent("auth:user-updated", { detail: user }));
};

export const isAuthenticated = () => !!getToken();

export const isAdmin = () => {
  const user = getUser();

  // support roles array
  return user?.roles?.includes("admin");
};

export const logout = () => {
  clearAuthCookies();
  clearAuthStorage(sessionStorage);
  clearAuthStorage(localStorage);
};
