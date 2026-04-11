export const saveAuth = (data) => {
  localStorage.setItem("token", data.access_token);
  localStorage.setItem("user", JSON.stringify(data.user));
};

export const getToken = () => localStorage.getItem("token");

export const getUser = () => {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
};

export const isAuthenticated = () => !!getToken();

export const isAdmin = () => {
  const user = getUser();
  return user?.role === "admin";
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};
