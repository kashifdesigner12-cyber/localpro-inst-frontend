import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import { API_BASE_URL } from "../../services/api";

function LoginPage({ onLoginSuccess }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const getUserRole = (user) => {
    if (!user) return "";
    return String(
      user.role || user.userRole || user.type || user.accountType || ""
    )
      .trim()
      .toUpperCase();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      localStorage.removeItem("teacherToken");
      localStorage.removeItem("teacherUser");
      localStorage.removeItem("studentToken");
      localStorage.removeItem("studentUser");

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok || !data?.success) {
        setError(
          data?.message || data?.error || `Login failed (${response.status})`
        );
        return;
      }

      const token =
        data?.data?.token ||
        data?.data?.accessToken ||
        data?.token ||
        data?.accessToken;

      if (!token) {
        setError("Authentication token was not received from server.");
        return;
      }

      const user = data?.data?.user || data?.user || null;
      const role = getUserRole(user);

      if (
        role === "ADMIN" ||
        role === "ADMINISTRATOR" ||
        role === "SUPER_ADMIN"
      ) {
        localStorage.setItem("adminToken", token);
        if (user) localStorage.setItem("adminUser", JSON.stringify(user));
        if (typeof onLoginSuccess === "function") onLoginSuccess(user);
        return;
      }

      if (role === "TEACHER" || role === "STAFF") {
        localStorage.setItem("teacherToken", token);
        if (user) localStorage.setItem("teacherUser", JSON.stringify(user));
        if (typeof onLoginSuccess === "function") onLoginSuccess(user);
        return;
      }

      if (role === "STUDENT") {
        localStorage.setItem("studentToken", token);
        if (user) localStorage.setItem("studentUser", JSON.stringify(user));
        if (typeof onLoginSuccess === "function") onLoginSuccess(user);
        return;
      }

      setError("Your account role could not be detected.");
    } catch (err) {
      console.error("Backend connection error:", err);
      setError("Server connection failed. Please check your internet or backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-br from-[#EFF6FF] via-[#E8F0FE] to-[#DBEAFE] flex items-center justify-center p-4 sm:p-6 font-sans text-slate-900">
      <div className="w-full max-w-[430px] bg-white/95 backdrop-blur-md rounded-3xl shadow-[0_24px_60px_rgba(12,35,75,0.12)] border border-white p-7 sm:p-10">
        {/* Top Clean Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFF6FF] border border-blue-200/80 text-[#1D4ED8] text-xs font-extrabold tracking-wide mb-4">
            <GraduationCap className="w-4 h-4 text-[#2563EB]" />
            <span>LOCALPRO1 PORTAL</span>
          </div>

          <h1 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            Sign in with your email or admission ID to continue
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-start gap-2">
            <span className="text-rose-500 font-bold shrink-0">!</span>
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email / Admission ID */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Email or Admission ID
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="username"
                placeholder="Enter email or admission ID"
                className="w-full bg-[#F8FAFC] border border-slate-200/90 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:bg-white focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                className="w-full bg-[#F8FAFC] border border-slate-200/90 rounded-2xl pl-10 pr-11 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:bg-white focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white font-bold text-sm shadow-[0_10px_25px_rgba(37,99,235,0.3)] border-t border-white/25 transition active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Signing In...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Note */}
        <p className="mt-7 pt-5 border-t border-slate-100 text-center text-xs text-slate-400">
          Need help accessing your account? Contact institute administration.
        </p>
      </div>
    </div>
  );
}

export default LoginPage;