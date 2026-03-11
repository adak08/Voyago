import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  // Let the browser set multipart boundary for FormData requests.
  if (config.data instanceof FormData) {
    if (config.headers) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }
  }

  return config;
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
        if (refreshError?.response?.data?.code === "TOKEN_REUSE_DETECTED") {
          const { useAuthStore } = await import("../store/authStore");
          await useAuthStore.getState().logout();
          sessionStorage.setItem(
            "authMessage",
            "Session invalidated for security. Please log in again.",
          );
          window.location.href = "/login";
        }

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
