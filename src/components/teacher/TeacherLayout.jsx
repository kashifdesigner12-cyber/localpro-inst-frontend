import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import FloatingChatWidget from "../chat/FloatingChatWidget";
import {
  LayoutDashboard,
  GraduationCap,
  CalendarCheck,
  PenTool,
  TrendingUp,
  FileText,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  Calendar,
  ChevronDown,
} from "lucide-react";

function TeacherLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // ======================================================
  // MAIN MENU
  // ======================================================
  const menuItems = [
    {
      name: "Dashboard",
      path: "/teacher/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Students",
      path: "/teacher/students",
      icon: GraduationCap,
    },
    {
      name: "Attendance",
      path: "/teacher/attendance",
      icon: CalendarCheck,
    },
    {
      name: "Performance Entry",
      path: "/teacher/performance",
      icon: PenTool,
    },
    {
      name: "Performance Graph",
      path: "/teacher/performance-graph",
      icon: TrendingUp,
    },
    {
      name: "Create Exam",
      path: "/teacher/exams",
      icon: FileText,
    },
  ];

  // ======================================================
  // LOGOUT
  // ======================================================
  const handleLogout = () => {
    localStorage.removeItem("teacherToken");
    localStorage.removeItem("teacherUser");

    navigate("/login", {
      replace: true,
    });
  };

  const teacherUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("teacherUser")) || {};
    } catch {
      return {};
    }
  })();

  const getPageTitle = (path) => {
    if (path.includes("/students")) return "Student Directory";
    if (path.includes("/attendance")) return "Daily Attendance Marking";
    if (path.includes("/performance-graph")) return "Academic Performance Analytics";
    if (path.includes("/performance")) return "Student Marks & Evaluations";
    if (path.includes("/exams")) return "Examinations Management";
    return "Teacher Dashboard Overview";
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const renderSidebarInner = (isMobile = false) => (
    <>
      <div>
        {/* TOP BRAND SECTION (3D Glossy Graduation-Cap Badge) */}
        <div className="relative pt-2 pb-5 mb-4 border-b border-white/10">
          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-0 top-0 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1D4ED8] to-[#38BDF8] shadow-lg shadow-blue-500/40 flex items-center justify-center mx-auto mb-2">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-lg font-extrabold tracking-tight text-center text-white">
            LocalPro1
          </h1>
          <p className="text-[11px] text-blue-200/75 text-center">
            Institute Management
          </p>
        </div>

        {/* NAVIGATION MENU */}
        <nav className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-270px)] pr-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(`${item.path}/`);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={
                  isActive
                    ? "bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white font-bold rounded-2xl px-4 py-3 shadow-[0_8px_20px_rgba(37,99,235,0.45)] border-t border-white/25 flex items-center gap-3 text-xs transition"
                    : "text-slate-300 hover:text-white hover:bg-white/10 rounded-2xl px-4 py-2.5 text-xs font-medium flex items-center gap-3 transition"
                }
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* BOTTOM 3D GLASS PROFILE & SIGN OUT */}
      <div className="pt-4 mt-4 border-t border-white/10">
        <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#2563EB] to-[#38BDF8] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
            {teacherUser?.name ? teacherUser.name.charAt(0).toUpperCase() : "T"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">
              {teacherUser?.name || "Teacher Staff"}
            </p>
            <p className="text-[11px] font-semibold text-emerald-400 truncate">
              ● Teacher
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-2.5 w-full py-2 rounded-xl border border-white/15 hover:bg-white/10 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="bg-[#E8F0FE] min-h-screen flex text-slate-900 font-sans">
      {/* DESKTOP 3D SIDEBAR */}
      <aside className="hidden lg:flex w-64 h-[calc(100vh-1.5rem)] sticky top-3 bg-gradient-to-b from-[#0C234B] via-[#091A3A] to-[#061126] text-white m-3 rounded-3xl shadow-[0_20px_50px_rgba(8,20,48,0.45)] flex-col justify-between p-4 shrink-0 z-40">
        {renderSidebarInner(false)}
      </aside>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          ></div>
          <aside className="relative z-50 w-64 bg-gradient-to-b from-[#0C234B] via-[#091A3A] to-[#061126] text-white m-3 rounded-3xl shadow-[0_20px_50px_rgba(8,20,48,0.45)] flex flex-col justify-between p-4 shrink-0">
            {renderSidebarInner(true)}
          </aside>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* TOP HEADER BAR */}
        <header className="sticky top-3 z-30 bg-white/90 backdrop-blur-md border border-white/80 rounded-2xl mx-4 mt-3 px-5 py-3 shadow-[0_4px_20px_rgba(15,23,42,0.04)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 bg-[#F1F5F9] rounded-full px-4 py-2 w-48 sm:w-72 text-xs text-slate-600 focus-within:ring-2 focus-within:ring-blue-500/20 transition">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder={`Search in ${getPageTitle(location.pathname)}...`}
                className="bg-transparent border-none outline-none text-xs text-slate-600 placeholder:text-slate-400 w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
            </button>

            <div className="hidden sm:flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>{currentDate}</span>
            </div>

            <div className="flex items-center gap-1.5 pl-1 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2563EB] to-[#38BDF8] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {teacherUser?.name ? teacherUser.name.charAt(0).toUpperCase() : "T"}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      {/* FLOATING CHAT WIDGET */}
      <FloatingChatWidget role="teacher" />
    </div>
  );
}

export default TeacherLayout;
