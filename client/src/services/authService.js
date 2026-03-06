import api from "./api";

export const authService = {
  register: async (name, email, password) => {
    const res = await api.post("/auth/register", { name, email, password });
    return res.data;
  },
  verifyOTP: async (email, otp) => {
    const res = await api.post("/auth/verify-otp", { email, otp });
    return res.data;
  },
  resendOTP: async (email) => {
    const res = await api.post("/auth/resend-otp", { email });
    return res.data;
  },
  login: async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    return res.data;
  },
  googleAuth: async (credential) => {
    const res = await api.post("/auth/google", { credential });
    return res.data;
  },
  refreshToken: async (refreshToken) => {
    const res = await api.post("/auth/refresh", { refreshToken });
    return res.data;
  },
  logout: async () => {
    const res = await api.post("/auth/logout");
    return res.data;
  },
  getMe: async () => {
    const res = await api.get("/auth/me");
    return res.data;
  },
};
