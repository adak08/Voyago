import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Attach token from localStorage on startup
const stored = localStorage.getItem("auth-storage");
if (stored) {
  try {
    const { state } = JSON.parse(stored);
    if (state?.token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${state.token}`;
    }
  } catch {}
}

// Response interceptor — handle 401 token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && error.response?.data?.code === "TOKEN_EXPIRED" && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers["Authorization"] = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        // Dynamically import store to avoid circular dep
        const { useAuthStore } = await import("../store/authStore");
        const newToken = await useAuthStore.getState().refreshAccessToken();
        if (newToken) {
          processQueue(null, newToken);
          original.headers["Authorization"] = `Bearer ${newToken}`;
          return api(original);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
