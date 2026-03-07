import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, KeyRound, Lock, Sun, Moon, ArrowLeft } from "lucide-react";
import { authService } from "../services/authService";
import { useThemeStore } from "../store/themeStore";
import { useAuthStore } from "../store/authStore";
import GoogleAuthButton from "../components/GoogleAuthButton";

const INITIAL_OTP = ["", "", "", "", "", ""];

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(INITIAL_OTP);
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const otpRefs = useRef([]);

  const { dark, toggle } = useThemeStore();
  const navigate = useNavigate();

  const onSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const data = await authService.forgotPassword(email);
      setMessage(data.message || "OTP sent to your email");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOTP = async (e) => {
    e.preventDefault();
    const code = otp.join("");

    if (code.length !== 6) {
      setError("Enter a valid 6-digit OTP");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const data = await authService.verifyResetOTP(email, code);
      setResetToken(data.resetToken);
      setMessage("OTP verified. Now set a new password.");
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirm password do not match");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const data = await authService.resetPassword(resetToken, password, confirmPassword);
      setMessage(data.message || "Password changed successfully");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const updateOtp = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);

    if (value && index < otp.length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = (e.clipboardData?.getData("text") || "").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    e.preventDefault();
    const filled = [...INITIAL_OTP];
    for (let i = 0; i < pasted.length; i += 1) {
      filled[i] = pasted[i];
    }
    setOtp(filled);

    const focusIndex = Math.min(pasted.length, 5);
    otpRefs.current[focusIndex]?.focus();
  };

  const handleGoogleAuth = async (credential) => {
    setError("");
    try {
      await useAuthStore.getState().googleLogin(credential);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.message || "Google login failed");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary-500/8 dark:bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-violet-500/8 dark:bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <button onClick={toggle} className="theme-toggle absolute top-4 right-4">
        {dark ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="w-full max-w-md relative page-enter">
        <div className="card p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Forgot password</h2>
            <span className="text-xs text-gray-400 dark:text-gray-500">Step {step}/3</span>
          </div>

          {message && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-xl mb-4 text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={onSendOTP} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" size={16} />
                  <input
                    type="email"
                    className="input-field pl-9"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm font-bold">
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={onVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Enter OTP</label>
                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpRefs.current[i] = el;
                      }}
                      type="text"
                      maxLength={1}
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => updateOtp(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-11 h-12 text-center text-lg font-bold border-2 border-gray-200 dark:border-surface-850 rounded-xl bg-white dark:bg-surface-900 text-gray-900 dark:text-gray-100"
                    />
                  ))}
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm font-bold">
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={onResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" size={16} />
                  <input
                    type="password"
                    className="input-field pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">Confirm Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" size={16} />
                  <input
                    type="password"
                    className="input-field pl-9"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm font-bold">
                {loading ? "Updating..." : "Change Password"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center gap-1 text-sm text-primary-500 dark:text-primary-400 font-medium hover:underline">
              <ArrowLeft size={14} /> Back to login
            </Link>
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200 dark:bg-surface-850" />
            <span className="text-xs text-gray-400 dark:text-gray-600">OR</span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-surface-850" />
          </div>

          <GoogleAuthButton onCredential={handleGoogleAuth} disabled={loading} />
        </div>
      </div>
    </div>
  );
}
