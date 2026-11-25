import React, { useState } from "react";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

// ================================
// REAL-TIME CHAT CONTEXT
// ================================
import { ChatProvider } from "./context/ChatContext";

// ================================
// AUTH
// ================================
import LoginPage from "./components/admin/LoginPage";

// ================================
// ADMIN
// ================================
import AdminLayout from "./components/admin/AdminLayout";
import Dashboard from "./components/admin/Dashboard";
import StaffManagement from "./components/admin/StaffManagement";
import StudentList from "./components/admin/StudentList";
import AddStudent from "./components/admin/AddStudent";
import FeeManagement from "./components/admin/FeeManagement";
import Attendance from "./components/admin/Attendance";
import ClassesList from "./components/admin/ClassesList";
import OfficeExpenses from "./components/admin/OfficeExpenses";

// ================================
// TEACHER
// ================================
import TeacherLayout from "./components/teacher/TeacherLayout";
import TeacherDashboard from "./components/teacher/TeacherDashboard";
import TeacherStudents from "./components/teacher/TeacherStudents";
import TeacherExams from "./components/teacher/TeacherExams";
import TeacherAttendance from "./components/teacher/TeacherAttendance";
import TeacherPerformance from "./components/teacher/TeacherPerformance";
import TeacherPerformanceGraph from "./components/teacher/TeacherPerformanceGraph";

// ================================
// STUDENT WHATSAPP CHAT PORTAL
// ================================
import StudentChatApp from "./components/chat/StudentChatApp";

// ======================================================
// ADMIN PROTECTED ROUTES
// ======================================================

function ProtectedAdminRoutes() {
  const adminToken = localStorage.getItem("adminToken");

  if (!adminToken) {
    return <Navigate to="/login" replace />;
  }

  return <AdminLayout />;
}

// ======================================================
// TEACHER PROTECTED ROUTES
// ======================================================

function ProtectedTeacherRoutes() {
  const teacherToken = localStorage.getItem("teacherToken");

  if (!teacherToken) {
    return <Navigate to="/login" replace />;
  }

  return <TeacherLayout />;
}

// ======================================================
// STUDENT PROTECTED ROUTES
// ======================================================

function ProtectedStudentRoutes({ onLogout }) {
  const studentToken = localStorage.getItem("studentToken");

  if (!studentToken) {
    return <Navigate to="/login" replace />;
  }

  return <StudentChatApp onLogout={onLogout} />;
}

// ======================================================
// APP CONTENT
// ======================================================

function AppContent() {
  const navigate = useNavigate();

  const [session, setSession] = useState(() => {
    if (localStorage.getItem("adminToken")) return "admin";
    if (localStorage.getItem("teacherToken")) return "teacher";
    if (localStorage.getItem("studentToken")) return "student";
    return null;
  });

  // ====================================================
  // LOGIN SUCCESS
  // ====================================================

  const handleLoginSuccess = (user) => {
    const role = String(
      user?.role ||
        user?.userRole ||
        user?.type ||
        user?.accountType ||
        ""
    )
      .trim()
      .toUpperCase();

    if (
      role === "ADMIN" ||
      role === "ADMINISTRATOR" ||
      role === "SUPER_ADMIN"
    ) {
      setSession("admin");
      navigate("/admin/dashboard", { replace: true });
      return;
    }

    if (role === "TEACHER" || role === "STAFF") {
      setSession("teacher");
      navigate("/teacher/dashboard", { replace: true });
      return;
    }

    if (role === "STUDENT") {
      setSession("student");
      navigate("/student/chat", { replace: true });
      return;
    }

    if (localStorage.getItem("adminToken")) {
      setSession("admin");
      navigate("/admin/dashboard", { replace: true });
      return;
    }

    if (localStorage.getItem("teacherToken")) {
      setSession("teacher");
      navigate("/teacher/dashboard", { replace: true });
      return;
    }

    if (localStorage.getItem("studentToken")) {
      setSession("student");
      navigate("/student/chat", { replace: true });
      return;
    }

    navigate("/login", { replace: true });
  };

  // ====================================================
  // LOGOUT
  // ====================================================

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("teacherToken");
    localStorage.removeItem("teacherUser");
    localStorage.removeItem("studentToken");
    localStorage.removeItem("studentUser");

    setSession(null);
    navigate("/login", { replace: true });
  };

  // ====================================================
  // ROUTES
  // ====================================================

  return (
    <ChatProvider session={session}>
      <Routes>
        {/* LOGIN */}
        <Route
          path="/login"
          element={
            session === "admin" ? (
              <Navigate to="/admin/dashboard" replace />
            ) : session === "teacher" ? (
              <Navigate to="/teacher/dashboard" replace />
            ) : session === "student" ? (
              <Navigate to="/student/chat" replace />
            ) : (
              <LoginPage onLoginSuccess={handleLoginSuccess} />
            )
          }
        />

        {/* ADMIN ROUTES */}
        <Route element={<ProtectedAdminRoutes />}>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/students" element={<StudentList />} />
          <Route path="/admin/add-student" element={<AddStudent />} />
          <Route path="/admin/staff" element={<StaffManagement />} />
          <Route path="/admin/classes" element={<ClassesList />} />
          <Route path="/admin/attendance" element={<Attendance />} />
          <Route path="/admin/fees" element={<FeeManagement />} />
          <Route path="/admin/expenses" element={<OfficeExpenses />} />
        </Route>

        {/* TEACHER ROUTES */}
        <Route element={<ProtectedTeacherRoutes />}>
          <Route
            path="/teacher/dashboard"
            element={<TeacherDashboard onLogout={handleLogout} />}
          />
          <Route path="/teacher/students" element={<TeacherStudents />} />
          <Route path="/teacher/attendance" element={<TeacherAttendance />} />
          <Route path="/teacher/performance" element={<TeacherPerformance />} />
          <Route
            path="/teacher/performance-graph"
            element={<TeacherPerformanceGraph />}
          />
          <Route path="/teacher/exams" element={<TeacherExams />} />
        </Route>

        {/* STUDENT WHATSAPP CHAT PORTAL */}
        <Route
          path="/student/chat"
          element={<ProtectedStudentRoutes onLogout={handleLogout} />}
        />

        {/* ROOT & FALLBACK */}
        <Route
          path="*"
          element={
            session === "admin" ? (
              <Navigate to="/admin/dashboard" replace />
            ) : session === "teacher" ? (
              <Navigate to="/teacher/dashboard" replace />
            ) : session === "student" ? (
              <Navigate to="/student/chat" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </ChatProvider>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;