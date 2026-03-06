import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { useThemeStore } from "./store/themeStore";

// Apply saved theme before first paint (no flash)
useThemeStore.getState().init();


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
