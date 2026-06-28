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
  if (token && config?.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  refreshQueue.forEach((promise) => {
    if (error) promise.reject(error);
    else promise.resolve(token);
  });
  refreshQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refresh = Cookies.get("refresh_token");
      if (!refresh) {
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        if (typeof window !== "undefined") window.location.href = "/auth/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api.request(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refresh_token: refresh });
        Cookies.set("access_token", data.access_token, { expires: 1 });
        Cookies.set("refresh_token", data.refresh_token, { expires: 7 });
        processQueue(null, data.access_token);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        }
        return api.request(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        if (typeof window !== "undefined") window.location.href = "/auth/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
