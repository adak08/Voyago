import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import TripDetails from "./pages/TripDetails";
import CreateTrip from "./pages/CreateTrip";
import OTPVerification from "./pages/OTPVerification";
import HomePage from "./pages/HomePage";

const ProtectedRoute = ({ children }) => {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" replace />;
};

const GuestRoute = ({ children }) => {
  const { token } = useAuthStore();
  return token ? <Navigate to="/dashboard" replace /> : children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home page — redirects to dashboard if already logged in */}
        <Route path="/" element={<GuestRoute><HomePage /></GuestRoute>} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/verify-otp" element={<GuestRoute><OTPVerification /></GuestRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/trip/new" element={<ProtectedRoute><CreateTrip /></ProtectedRoute>} />
        <Route path="/trip/:id" element={<ProtectedRoute><TripDetails /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
