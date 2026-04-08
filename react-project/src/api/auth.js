import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000", // your FastAPI URL
});

export const loginUser = async (email, password) => {
//   const formData = new URLSearchParams();
//   formData.append("username", email); // FastAPI OAuth2PasswordRequestForm uses "username"
//   formData.append("password", password);

  const response = await API.post("/auth/login", 
    // formData, 
    {
        "email": email,
        "password": password
    },
    {
        headers: {
        "Content-Type": "application/json",
        },
  });

  return response.data;
};

export default API;