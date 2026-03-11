import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService } from "../services/authService";
import api from "../services/api";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      loading: false,
      error: null,

      setTokens: (accessToken, refreshToken) => {
        set({ token: accessToken, refreshToken });
        api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      },

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const data = await authService.login(email, password);
          get().setTokens(data.accessToken, data.refreshToken);
          set({ user: data.user, loading: false });
          return data;
        } catch (err) {
          const msg = err.response?.data?.message || "Login failed";
          set({ error: msg, loading: false });
          throw new Error(msg);
        }
      },

      register: async (name, email, password) => {
        set({ loading: true, error: null });
        try {
          const data = await authService.register(name, email, password);
          set({ loading: false });
          return data;
        } catch (err) {
          const msg = err.response?.data?.message || "Registration failed";
          set({ error: msg, loading: false });
          throw new Error(msg);
        }
      },

      verifyOTP: async (email, otp) => {
        set({ loading: true, error: null });
        try {
          const data = await authService.verifyOTP(email, otp);
          get().setTokens(data.accessToken, data.refreshToken);
          set({ user: data.user, loading: false });
          return data;
        } catch (err) {
          const msg = err.response?.data?.message || "OTP verification failed";
          set({ error: msg, loading: false });
          throw new Error(msg);
        }
      },

      googleLogin: async (credential) => {
        set({ loading: true, error: null });
        try {
          const data = await authService.googleAuth(credential);
          get().setTokens(data.accessToken, data.refreshToken);
          set({ user: data.user, loading: false });
          return data;
        } catch (err) {
          const msg = err.response?.data?.message || "Google login failed";
          set({ error: msg, loading: false });
          throw new Error(msg);
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch {}
        set({ user: null, token: null, refreshToken: null });
        delete api.defaults.headers.common["Authorization"];
      },

      refreshAccessToken: async () => {
        try {
          const { refreshToken } = get();
          if (!refreshToken) throw new Error("No refresh token");
          const data = await authService.refreshToken(refreshToken);
          get().setTokens(data.accessToken, data.refreshToken);
          return data.accessToken;
        } catch (err) {
          if (err?.response?.data?.code === "TOKEN_REUSE_DETECTED") {
            throw err;
          }

          get().logout();
          return null;
        }
      },

      updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),
      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user, token: state.token, refreshToken: state.refreshToken }),
    }
  )
);
