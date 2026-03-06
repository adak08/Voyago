import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, RefreshCw, Sun, Moon } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { authService } from "../services/authService";
import { useThemeStore } from "../store/themeStore";

export default function OTPVerification() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(60);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);
  const { verifyOTP, loading, error, clearError } = useAuthStore();
  const { dark, toggle } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) navigate("/register");
    const timer = setInterval(() => setResendTimer((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) return;
    try {
      await verifyOTP(email, otpCode);
      navigate("/dashboard");
    } catch {}
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authService.resendOTP(email);
      setResendTimer(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch {}
    setResending(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-500/8 dark:bg-primary-500/5 rounded-full blur-3xl" />
      </div>

      <button onClick={toggle} className="theme-toggle absolute top-4 right-4">
        {dark ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="w-full max-w-md relative page-enter">
        <div className="card p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-50 dark:bg-primary-900/30 rounded-2xl mb-5">
            <Mail className="text-primary-500 dark:text-primary-400" size={26} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Check your email</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-7">
            We sent a 6-digit code to<br />
            <strong className="text-gray-800 dark:text-gray-200">{email}</strong>
          </p>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="flex gap-2 justify-center mb-6">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold
                             border-2 border-gray-200 dark:border-surface-850 rounded-xl
                             bg-white dark:bg-surface-900
                             text-gray-900 dark:text-gray-100
                             focus:border-primary-500 dark:focus:border-primary-400
                             focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-400/20
                             focus:outline-none transition-all duration-200"
                />
              ))}
            </div>

            <button type="submit"
              disabled={loading || otp.join("").length !== 6}
              className="btn-primary w-full py-3 text-sm font-bold">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying…
                </span>
              ) : "Verify email"}
            </button>
          </form>

          <div className="mt-5">
            {resendTimer > 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">Resend code in {resendTimer}s</p>
            ) : (
              <button onClick={handleResend} disabled={resending}
                className="inline-flex items-center gap-1.5 text-sm text-primary-500 dark:text-primary-400 hover:underline font-medium">
                <RefreshCw size={13} className={resending ? "animate-spin" : ""} />
                {resending ? "Sending…" : "Resend code"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
