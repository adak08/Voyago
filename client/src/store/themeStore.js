import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useThemeStore = create(
  persist(
    (set, get) => ({
      dark: false,

      toggle: () => {
        const next = !get().dark;
        set({ dark: next });
        applyTheme(next);
      },

      init: () => {
        applyTheme(get().dark);
      },
    }),
    { name: "tripsync-theme" }
  )
);

function applyTheme(dark) {
  if (dark) document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
}
