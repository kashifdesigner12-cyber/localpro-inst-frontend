import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Users,
  School,
  CreditCard,
  TrendingUp,
  RotateCw,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Receipt,
  Scale,
  Zap,
} from "lucide-react";
import { apiCall } from "../../services/api";

function Dashboard() {
  // =========================================================
  // STATE
  // =========================================================
  const [stats, setStats] = useState({
    totalStudents: 0,
    maleStudents: 0,
    femaleStudents: 0,
    totalStaff: 0,
    totalClasses: 0,
    totalSubjects: 0,
    presentToday: 0,
    absentToday: 0,
    totalCollected: 0,
    pendingFee: 0,
    income: 0,
    expense: 0,
    balance: 0,
  });

  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // =========================================================
  // NUMBER FORMAT
  // =========================================================
  const formatNumber = (value) => {
    const number = Number(value);
    if (Number.isNaN(number)) {
      return "0";
    }
    return number.toLocaleString();
  };

  // =========================================================
  // FETCH DASHBOARD
  // =========================================================
  const fetchDashboardData = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const adminToken = localStorage.getItem("adminToken");

      if (!adminToken) {
        setErrorMsg("Admin login required. Please login first.");
        setLoading(false);
        return;
      }

      const result = await apiCall("/dashboard", "GET");

      if (!result.success) {
        setErrorMsg(result.message || "Failed to load dashboard data.");
        return;
      }

      const dashboardData = result.data?.data || {};

      setStats({
        totalStudents: Number(dashboardData.totalStudents) || 0,
        maleStudents: Number(dashboardData.maleStudents) || 0,
        femaleStudents: Number(dashboardData.femaleStudents) || 0,
        totalStaff: Number(dashboardData.totalStaff) || 0,
        totalClasses: Number(dashboardData.totalClasses) || 0,
        totalSubjects: Number(dashboardData.totalSubjects) || 0,
        presentToday: Number(dashboardData.presentToday) || 0,
        absentToday: Number(dashboardData.absentToday) || 0,
        totalCollected: Number(dashboardData.totalCollected) || 0,
        pendingFee: Number(dashboardData.pendingFees) || 0,
        income: Number(dashboardData.totalIncome) || 0,
        expense: Number(dashboardData.totalExpense) || 0,
        balance: Number(dashboardData.balance) || 0,
      });

      if (Array.isArray(dashboardData.recentStudents)) {
        setRecentStudents(dashboardData.recentStudents);
      } else {
        setRecentStudents([]);
      }
    } catch (error) {
      console.error("Dashboard connection error:", error);
      setErrorMsg(
        error.message ||
          "Unable to connect to backend. Please check the live backend server."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] p-8">
        <div className="w-10 h-10 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          Loading institutional analytics...
        </p>
      </div>
    );
  }

  const attendanceTotal = stats.presentToday + stats.absentToday;
  const attendanceRate =
    attendanceTotal > 0
      ? Math.round((stats.presentToday / attendanceTotal) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* =========================================================
          ROW 1: CLEAN ROYAL BLUE HERO BANNER WITH BLENDED REALISTIC CAMPUS
      ========================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0C234B] via-[#1D4ED8] to-[#2563EB] text-white shadow-[0_18px_40px_rgba(29,78,216,0.28)] border-t border-white/25 min-h-[210px] flex items-center">
        {/* Blended Realistic Campus Image on the Right (No Box, No Extra Badges) */}
        <div className="hidden md:block absolute inset-y-0 right-0 w-[56%] pointer-events-none">
          <img
            src="/welcome-campus.jpg"
            alt="LocalPro1 Institute Campus"
            className="w-full h-full object-cover object-center"
          />
          {/* Smooth left-to-right gradient fade blending the photo seamlessly into the blue banner */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1D4ED8] via-[#1D4ED8]/55 to-transparent" />
        </div>

        {/* Left Content */}
        <div className="relative z-10 p-7 sm:p-9 max-w-xl text-center md:text-left">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-xs text-white">
            Welcome Back, Admin!
          </h1>
          <p className="text-blue-100 text-sm mt-1.5">
            Here's what's happening at LocalPro1 Institute today.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center md:justify-start gap-3">
            <Link
              to="/admin/students"
              className="inline-flex items-center gap-2 bg-white text-[#0C234B] hover:bg-blue-50 font-bold text-xs px-5 py-2.5 rounded-full shadow-md transition active:scale-95"
            >
              <span>View Details</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
            <Link
              to="/admin/fees"
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white border border-white/25 font-semibold text-xs px-4 py-2.5 rounded-full backdrop-blur-xs transition"
            >
              <span>Fee Ledger</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200/80 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* =========================================================
          ROW 2: 4 GLOSSY 3D KPI STAT CARDS
      ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* CARD 1: TOTAL ENROLLED (3D ROYAL BLUE) */}
        <div className="rounded-3xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] text-white p-5 shadow-[0_12px_28px_rgba(37,99,235,0.28)] border-t border-white/30 flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 bg-white/20 backdrop-blur-xs border border-white/30 text-white">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-blue-100 font-medium">
                Total Enrolled
              </p>
              <h3 className="text-3xl font-extrabold tabular-nums text-white mt-0.5">
                {formatNumber(stats.totalStudents)}
              </h3>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/20">
            <span className="inline-flex items-center gap-2 bg-white/15 rounded-xl px-3 py-1 text-[11px] font-semibold text-white">
              <span>Male: {formatNumber(stats.maleStudents)}</span>
              <span>•</span>
              <span>Female: {formatNumber(stats.femaleStudents)}</span>
            </span>
          </div>
        </div>

        {/* CARD 2: FACULTY & STAFF (3D EMERALD MINT) */}
        <div className="rounded-3xl bg-gradient-to-br from-[#059669] to-[#34D399] text-white p-5 shadow-[0_12px_28px_rgba(16,185,129,0.26)] border-t border-white/30 flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 bg-white/20 backdrop-blur-xs border border-white/30 text-white">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-emerald-50 font-medium">
                Faculty & Staff
              </p>
              <h3 className="text-3xl font-extrabold tabular-nums text-white mt-0.5">
                {formatNumber(stats.totalStaff)}
              </h3>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 bg-white/15 rounded-xl px-3 py-1 text-[11px] font-semibold text-white">
              ● Active Staff
            </span>
          </div>
        </div>

        {/* CARD 3: ACTIVE CLASSES (3D SOFT LAVENDER) */}
        <div className="rounded-3xl bg-gradient-to-br from-[#EDE9FE] via-[#E0E7FF] to-[#DDD6FE] text-slate-900 p-5 shadow-[0_10px_25px_rgba(99,102,241,0.12)] border border-white flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br from-[#4F46E5] to-[#6366F1] text-white shadow-md shadow-indigo-500/30">
              <School className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-600 font-semibold">
                Active Classes
              </p>
              <h3 className="text-3xl font-extrabold text-slate-900 tabular-nums mt-0.5">
                {formatNumber(stats.totalClasses)}
              </h3>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-indigo-200/70 flex items-center justify-between gap-2">
            <span className="bg-indigo-600/10 text-indigo-800 rounded-xl px-2.5 py-1 text-[11px] font-semibold">
              {formatNumber(stats.totalSubjects)} Courses
            </span>
            <span className="bg-white/70 text-indigo-900 rounded-xl px-2.5 py-1 text-[11px] font-semibold">
              {attendanceRate}% Present
            </span>
          </div>
        </div>

        {/* CARD 4: FEE COLLECTED (3D WARM GOLD/PEACH) */}
        <div className="rounded-3xl bg-gradient-to-br from-[#FEF3C7] via-[#FDE68A]/80 to-[#FCD34D]/60 text-slate-900 p-5 shadow-[0_10px_25px_rgba(245,158,11,0.14)] border border-white flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br from-[#D97706] to-[#F59E0B] text-white shadow-md shadow-amber-500/30">
              <CreditCard className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-700 font-semibold">
                Fee Collected
              </p>
              <h3 className="text-xl xl:text-2xl font-extrabold text-slate-900 tabular-nums whitespace-nowrap mt-0.5">
                Rs {formatNumber(stats.totalCollected)}
              </h3>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-amber-200/70">
            <div className="bg-amber-500/15 text-amber-900 rounded-xl px-3 py-1 text-[11px] font-bold flex items-center justify-between">
              <span>Pending Dues</span>
              <span className="tabular-nums">
                Rs {formatNumber(stats.pendingFee)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          ROW 3: 3D FINANCIAL OVERVIEW, FEE STATUS & QUICK ACTIONS
      ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* CARD 1: FINANCIAL OVERVIEW */}
        <div className="bg-white/95 backdrop-blur-xs rounded-3xl border border-white shadow-[0_14px_34px_rgba(15,23,42,0.06)] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    Financial Overview
                  </h3>
                  <Link
                    to="/admin/expenses"
                    className="text-xs font-bold text-[#2563EB] hover:underline inline-block mt-0.5"
                  >
                    View Report &rarr;
                  </Link>
                </div>
              </div>

              <svg
                viewBox="0 0 44 44"
                className="w-10 h-10 shrink-0 drop-shadow-[0_4px_10px_rgba(37,99,235,0.25)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient
                    id="pieBlue"
                    x1="4"
                    y1="4"
                    x2="40"
                    y2="40"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#60A5FA" />
                    <stop offset="1" stopColor="#1D4ED8" />
                  </linearGradient>
                </defs>
                <circle cx="22" cy="24" r="16" fill="#1E3A8A" fillOpacity="0.22" />
                <circle cx="22" cy="21" r="16" fill="url(#pieBlue)" />
                <path
                  d="M22 21V5C30.8366 5 38 12.1634 38 21H22Z"
                  fill="#93C5FD"
                />
                <path
                  d="M24 19V5.5C31.2 6.4 36.6 11.8 37.5 19H24Z"
                  fill="#DBEAFE"
                />
              </svg>
            </div>

            <div className="space-y-2.5">
              <div className="bg-[#F8FAFC] border border-slate-100 rounded-2xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg flex items-center justify-center">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-xs font-semibold text-slate-700">
                    Total Income
                  </span>
                </div>
                <span className="text-sm font-extrabold text-emerald-600 tabular-nums">
                  Rs {formatNumber(stats.income)}
                </span>
              </div>

              <div className="bg-[#F8FAFC] border border-slate-100 rounded-2xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="bg-rose-50 text-rose-600 p-1.5 rounded-lg flex items-center justify-center">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-xs font-semibold text-slate-700">
                    Total Expenses
                  </span>
                </div>
                <span className="text-sm font-extrabold text-rose-600 tabular-nums">
                  Rs {formatNumber(stats.expense)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-gradient-to-r from-[#EFF6FF] to-[#DBEAFE] border border-blue-200/70 rounded-2xl px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-white/80 text-[#2563EB] flex items-center justify-center shadow-2xs">
                <Scale className="w-4 h-4" />
              </span>
              <span className="text-xs font-extrabold text-slate-900">
                Net Reserve Balance
              </span>
            </div>
            <span
              className={`text-sm font-extrabold tabular-nums ${
                stats.balance >= 0 ? "text-[#1D4ED8]" : "text-rose-600"
              }`}
            >
              Rs {formatNumber(stats.balance)}
            </span>
          </div>
        </div>

        {/* CARD 2: FEE COLLECTION STATUS */}
        <div className="bg-white/95 backdrop-blur-xs rounded-3xl border border-white shadow-[0_14px_34px_rgba(15,23,42,0.06)] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    Fee Collection Status
                  </h3>
                  <Link
                    to="/admin/fees"
                    className="text-xs font-bold text-[#2563EB] hover:underline inline-block mt-0.5"
                  >
                    View Ledger &rarr;
                  </Link>
                </div>
              </div>

              <svg
                viewBox="0 0 44 44"
                className="w-10 h-10 shrink-0 drop-shadow-[0_4px_10px_rgba(245,158,11,0.28)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient
                    id="coinGold"
                    x1="8"
                    y1="8"
                    x2="36"
                    y2="36"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#FDE68A" />
                    <stop offset="1" stopColor="#D97706" />
                  </linearGradient>
                </defs>
                <ellipse cx="22" cy="33" rx="13" ry="5" fill="#B45309" />
                <ellipse cx="22" cy="30" rx="13" ry="5" fill="#F59E0B" />
                <ellipse cx="22" cy="25" rx="13" ry="5" fill="#D97706" />
                <ellipse cx="22" cy="22" rx="13" ry="5" fill="#FBBF24" />
                <ellipse cx="22" cy="17" rx="13" ry="5" fill="#D97706" />
                <ellipse cx="22" cy="14" rx="13" ry="5" fill="url(#coinGold)" />
                <ellipse
                  cx="22"
                  cy="14"
                  rx="9"
                  ry="3"
                  stroke="#FFFFFF"
                  strokeOpacity="0.65"
                  strokeWidth="1"
                />
              </svg>
            </div>

            <div className="grid grid-cols-2 gap-3 my-4 py-3 rounded-2xl bg-[#F8FAFC] border border-slate-100">
              <div className="text-center px-2">
                <span className="text-xs text-slate-500 font-semibold block">
                  Collected
                </span>
                <p className="text-lg xl:text-xl font-extrabold text-emerald-600 tabular-nums mt-1">
                  Rs {formatNumber(stats.totalCollected)}
                </p>
              </div>
              <div className="text-center px-2 border-l border-slate-200/80">
                <span className="text-xs text-slate-500 font-semibold block">
                  Pending
                </span>
                <p className="text-lg xl:text-xl font-extrabold text-rose-500 tabular-nums mt-1">
                  Rs {formatNumber(stats.pendingFee)}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">Collection Recovery Rate</span>
              <span className="text-[11px] font-medium text-slate-400">
                {stats.presentToday} P / {stats.absentToday} A Today
              </span>
            </div>
            <div className="flex items-center">
              <div className="h-3.5 w-full bg-slate-100 rounded-full p-0.5 shadow-inner flex items-center">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#059669] via-[#10B981] to-[#34D399] shadow-sm transition-all duration-500"
                  style={{
                    width: `${
                      stats.totalCollected + stats.pendingFee > 0
                        ? Math.round(
                            (stats.totalCollected /
                              (stats.totalCollected + stats.pendingFee)) *
                              100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
              <span className="text-xs font-extrabold text-slate-800 ml-3 tabular-nums shrink-0">
                {stats.totalCollected + stats.pendingFee > 0
                  ? `${Math.round(
                      (stats.totalCollected /
                        (stats.totalCollected + stats.pendingFee)) *
                        100
                    )}%`
                  : "0%"}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: QUICK ACTIONS */}
        <div className="bg-white/95 backdrop-blur-xs rounded-3xl border border-white shadow-[0_14px_34px_rgba(15,23,42,0.06)] p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                Quick Actions
              </h3>
            </div>
            <button
              type="button"
              onClick={fetchDashboardData}
              title="Refresh Dashboard"
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 transition"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3.5 mt-3 flex-1">
            <Link
              to="/admin/students"
              className="rounded-2xl bg-gradient-to-br from-[#DBEAFE] to-[#BFDBFE]/70 hover:scale-[1.02] border border-white p-4 flex flex-col items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <div className="bg-[#2563EB] text-white p-2.5 rounded-xl shadow-md shadow-blue-500/30 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800">Students</span>
            </Link>

            <Link
              to="/admin/staff"
              className="rounded-2xl bg-gradient-to-br from-[#D1FAE5] to-[#A7F3D0]/70 hover:scale-[1.02] border border-white p-4 flex flex-col items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <div className="bg-[#059669] text-white p-2.5 rounded-xl shadow-md shadow-emerald-500/30 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800">Staff</span>
            </Link>

            <Link
              to="/admin/fees"
              className="rounded-2xl bg-gradient-to-br from-[#EDE9FE] to-[#DDD6FE]/70 hover:scale-[1.02] border border-white p-4 flex flex-col items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <div className="bg-[#4F46E5] text-white p-2.5 rounded-xl shadow-md shadow-indigo-500/30 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                Fee Ledger
              </span>
            </Link>

            <Link
              to="/admin/expenses"
              className="rounded-2xl bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A]/70 hover:scale-[1.02] border border-white p-4 flex flex-col items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <div className="bg-[#EA580C] text-white p-2.5 rounded-xl shadow-md shadow-orange-500/30 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800">Expenses</span>
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================
          RECENT STUDENTS TABLE
      ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Recently Enrolled Students
              </h3>
              <p className="text-xs text-slate-500">
                Latest student admissions synchronized from institute database.
              </p>
            </div>
          </div>

          <Link
            to="/admin/students"
            className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1"
          >
            <span>View All &rarr;</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">#</th>
                <th className="py-3.5 px-5">Student Name</th>
                <th className="py-3.5 px-5">Admission ID</th>
                <th className="py-3.5 px-5">Enrolled Course / Class</th>
                <th className="py-3.5 px-5">Section</th>
                <th className="py-3.5 px-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {recentStudents.length > 0 ? (
                recentStudents.map((student, index) => {
                  const status = String(
                    student.status || "ACTIVE"
                  ).toUpperCase();
                  return (
                    <tr
                      key={student.id || student._id || index}
                      className="hover:bg-blue-50/40 transition-colors"
                    >
                      <td className="py-3.5 px-5 text-slate-400 font-medium tabular-nums">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-slate-900">
                        {student.name || "N/A"}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-600">
                        {student.admissionNo || "N/A"}
                      </td>
                      <td className="py-3.5 px-5 text-slate-600 max-w-xs truncate">
                        {student.className || "N/A"}
                      </td>
                      <td className="py-3.5 px-5 text-slate-600">
                        {student.section || "N/A"}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            status === "INACTIVE"
                              ? "bg-rose-50 text-rose-700 border-rose-200/80"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-10 text-slate-400 font-medium"
                  >
                    No recent student records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;