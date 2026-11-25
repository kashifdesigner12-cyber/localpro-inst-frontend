import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, GraduationCap, ArrowRight } from 'lucide-react';
import { apiCall } from '../../services/api';

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await apiCall('/teachers/login', 'POST', { email, password });

    setLoading(false);
    if (res.success) {
      localStorage.setItem('teacherToken', res.data.token);
      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess();
      }
    } else {
      setError(res.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[#E8F0FE] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-5xl rounded-3xl bg-white shadow-[0_24px_60px_rgba(8,20,48,0.16)] border border-white overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Showcase Panel */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#0C234B] via-[#091A3A] to-[#061126] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-16 -left-16 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1D4ED8] to-[#38BDF8] shadow-lg shadow-blue-500/40 border border-white/20 flex items-center justify-center mb-4">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">LocalPro1</h1>
            <p className="text-xs text-blue-200/80 font-medium mt-0.5">Institute Management System</p>
          </div>

          <div className="relative z-10 my-8">
            <h2 className="text-xl font-bold leading-snug text-white mb-4">
              Next-Generation Academic & Campus Operations
            </h2>
            <div className="space-y-2.5">
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 text-xs text-blue-100">
                Real-Time Attendance, Exams & Performance Analytics
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 text-xs text-blue-100">
                Automated Fee Ledgers & Role-Based Access
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 text-xs text-blue-100">
                Integrated Classroom Messaging & Task Grading
              </div>
            </div>
          </div>

          <div className="relative z-10 text-[11px] text-blue-300/70 border-t border-white/10 pt-5">
            &copy; {new Date().getFullYear()} LocalPro1 Institute Portal
          </div>
        </div>

        {/* Right Auth Form Panel */}
        <div className="lg:col-span-7 bg-white p-8 sm:p-12 flex flex-col justify-center">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Teacher Portal Login</h2>
            <p className="text-xs text-slate-500 mt-1 mb-6">Enter your credentials to access the teacher dashboard.</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-[#F8FAFC] border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition w-full"
                  placeholder="teacher@localpro1.net"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-[#F8FAFC] border border-slate-200 rounded-2xl pl-11 pr-11 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition w-full"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white font-bold text-sm shadow-[0_10px_25px_rgba(37,99,235,0.35)] border-t border-white/25 transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? <span>Signing in...</span> : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
