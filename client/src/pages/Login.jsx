import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plane, Mail, Lock, Eye, EyeOff, Sun, Moon } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import GoogleAuthButton from "../components/GoogleAuthButton";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const { login, loading, error, clearError } = useAuthStore();
  const { dark, toggle } = useThemeStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch {}
  };

  const handleGoogleAuth = async (credential) => {
    clearError();
    try {
      await useAuthStore.getState().googleLogin(credential);
      navigate("/dashboard");
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4 relative">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary-500/8 dark:bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-violet-500/8 dark:bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      {/* Theme toggle */}
      <button onClick={toggle} className="theme-toggle absolute top-4 right-4">
        {dark ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="w-full max-w-md relative page-enter">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary-500 to-violet-600 rounded-2xl mb-4 shadow-xl shadow-primary-500/25">
            <Plane className="text-white" size={26} />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Voyago</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Smart group trip planner</p>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Welcome back</h2>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-5 text-sm flex items-start gap-2">
              <span className="mt-0.5">⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" size={16} />
                <input type="email" className="input-field pl-9" placeholder="you@example.com"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" size={16} />
                <input type={showPass ? "text" : "password"} className="input-field pl-9 pr-10" placeholder="••••••••"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 text-sm font-bold">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : "Sign in"}
            </button>

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-xs text-primary-500 dark:text-primary-400 font-medium hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200 dark:bg-surface-850" />
            <span className="text-xs text-gray-400 dark:text-gray-600">OR</span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-surface-850" />
          </div>

          <GoogleAuthButton onCredential={handleGoogleAuth} disabled={loading} />

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            No account?{" "}
            <Link to="/register" className="text-primary-500 dark:text-primary-400 font-semibold hover:underline">
              Create one free
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          <Link to="/" className="hover:text-primary-500 transition-colors">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
