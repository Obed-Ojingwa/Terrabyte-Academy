import axios from "axios";
import Cookies from "js-cookie";

const fallbackBaseUrl = typeof window !== "undefined"
  ? window.location.origin.includes("vercel.app")
    ? "https://terrabyte-acad-backend.onrender.com/api/v1"
    : "http://localhost:8000/api/v1"
  : "https://terrabyte-acad-backend.onrender.com/api/v1";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || fallbackBaseUrl,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refresh = Cookies.get("refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refresh_token: refresh });
          Cookies.set("access_token", data.access_token, { expires: 1 });
          error.config.headers.Authorization = `Bearer ${data.access_token}`;
          return api.request(error.config);
        } catch {
          Cookies.remove("access_token");
          Cookies.remove("refresh_token");
          if (typeof window !== "undefined") window.location.href = "/auth/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
