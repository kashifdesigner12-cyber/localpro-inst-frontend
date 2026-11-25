import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  School,
  CreditCard,
  Receipt,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

function Sidebar({ mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Students",
      path: "/admin/students",
      icon: GraduationCap,
    },
    {
      name: "Staff Management",
      path: "/admin/staff",
      icon: Users,
    },
    {
      name: "Classes",
      path: "/admin/classes",
      icon: School,
    },
    {
      name: "Fee Management",
      path: "/admin/fees",
      icon: CreditCard,
    },
    {
      name: "Office Expenses",
      path: "/admin/expenses",
      icon: Receipt,
    },
  ];

  // ==================================================
  // Logout
  // ==================================================
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("teacherToken");
    localStorage.removeItem("teacherUser");

    navigate("/login", {
      replace: true,
    });

    window.location.reload();
  };

  const adminUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("adminUser")) || {};
    } catch {
      return {};
    }
  })();

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full bg-gradient-to-b from-[#0E2342] to-[#081529] text-white">
      {/* =========================================
          BRANDING & HEADER
      ========================================= */}
      <div>
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="bg-[#2563EB] p-2.5 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-600/30 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-white tracking-tight leading-tight">
                LocalPro1
              </h1>
              <p className="text-xs text-slate-300 truncate">
                Institute Management
              </p>
            </div>
          </div>

          {setMobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* =========================================
            NAVIGATION MENU
        ========================================= */}
        <nav className="p-3.5 space-y-1.5 overflow-y-auto max-h-[calc(100vh-175px)]">
          <div className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400/80">
            Navigation
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(`${item.path}/`);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen && setMobileOpen(false)}
                className={
                  isActive
                    ? "bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white font-semibold rounded-xl px-4 py-3 shadow-lg shadow-blue-600/30 flex items-center justify-between gap-3 transition-all"
                    : "text-slate-300 hover:bg-white/10 hover:text-white rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between gap-3 transition"
                }
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-white" : "text-slate-400"
                    }`}
                  />
                  <span className="text-sm">{item.name}</span>
                </div>
                {isActive && (
                  <ChevronRight className="w-4 h-4 text-white/90" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* =========================================
          SIDEBAR FOOTER & USER PROFILE
      ========================================= */}
      <div className="pt-2 pb-3 border-t border-white/10 bg-[#081529]">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 mx-3 mb-2 flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs font-bold shadow-xs">
              {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : "A"}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#081529]"></span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">
              {adminUser?.name || "Administrator"}
            </p>
            <p className="text-[11px] font-medium text-emerald-400 truncate">
              ● Super Admin
            </p>
          </div>
        </div>

        <div className="px-3">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-300 hover:text-white hover:bg-rose-500/20 border border-white/5 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP FIXED SIDEBAR */}
      <aside className="hidden lg:block fixed left-0 top-0 z-40 w-64 h-screen border-r border-[#0E223D]/60 shadow-[2px_0_12px_rgba(0,0,0,0.1)]">
        {sidebarContent}
      </aside>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          ></div>
          <div className="relative z-50 w-64 h-full shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
