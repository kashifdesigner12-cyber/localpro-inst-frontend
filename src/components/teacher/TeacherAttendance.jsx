import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  RotateCw,
  Save,
  Check,
  AlertCircle,
  Users,
} from "lucide-react";
import { apiCall } from "../../services/api";

function TeacherAttendance() {
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const loadAttendance = async () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const studentsResult = await apiCall("/students?limit=100", "GET");
      if (!studentsResult.success) {
        setErrorMsg(studentsResult.message || "Failed to load students.");
        return;
      }
      const studentList = studentsResult.data?.data?.students || [];

      const attendanceResult = await apiCall(`/attendance/date/${today}`, "GET");
      if (!attendanceResult.success) {
        setStudents(
          studentList.map((student) => ({
            ...student,
            attendanceStatus: "PRESENT",
            remarks: "",
          }))
        );
        return;
      }

      const attendanceList = attendanceResult.data?.data?.attendance || [];
      const attendanceMap = {};

      attendanceList.forEach((record) => {
        const studentId =
          record.student?._id ||
          record.student?.id ||
          record.studentId?._id ||
          record.studentId ||
          record._id;

        if (studentId) {
          attendanceMap[String(studentId)] = {
            status: String(record.status || "PRESENT").toUpperCase(),
            remarks: record.remarks || "",
          };
        }
      });

      const mergedStudents = studentList.map((student) => {
        const studentId = String(student._id || student.id);
        const savedAttendance = attendanceMap[studentId];

        return {
          ...student,
          attendanceStatus: savedAttendance?.status || "PRESENT",
          remarks: savedAttendance?.remarks || "",
        };
      });

      setStudents(mergedStudents);
    } catch (error) {
      console.error("Load attendance error:", error);
      setErrorMsg(error.message || "Unable to load attendance.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const classes = useMemo(() => {
    const uniqueClasses = [
      ...new Set(students.map((student) => student.className).filter(Boolean)),
    ];
    return uniqueClasses.sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (selectedClass === "ALL") {
      return students;
    }
    return students.filter(
      (student) => String(student.className || "") === selectedClass
    );
  }, [students, selectedClass]);

  const handleStatusChange = (studentId, newStatus) => {
    setStudents((prev) =>
      prev.map((student) => {
        const id = String(student._id || student.id);
        if (id !== String(studentId)) {
          return student;
        }
        return {
          ...student,
          attendanceStatus: newStatus.toUpperCase(),
        };
      })
    );
    setSuccessMsg("");
    setErrorMsg("");
  };

  const handleRemarksChange = (studentId, newRemarks) => {
    setStudents((prev) =>
      prev.map((student) => {
        const id = String(student._id || student.id);
        if (id !== String(studentId)) {
          return student;
        }
        return {
          ...student,
          remarks: newRemarks,
        };
      })
    );
  };

  const markAll = (status) => {
    setStudents((prev) =>
      prev.map((student) => {
        const isInCurrentFilter =
          selectedClass === "ALL" ||
          String(student.className || "") === selectedClass;

        if (!isInCurrentFilter) {
          return student;
        }

        return {
          ...student,
          attendanceStatus: status.toUpperCase(),
        };
      })
    );
  };

  const handleSaveAttendance = async () => {
    if (filteredStudents.length === 0) {
      setErrorMsg("No students available to save attendance.");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const attendanceRecords = filteredStudents.map((student) => ({
        studentId: student._id || student.id,
        status: student.attendanceStatus || "PRESENT",
        remarks: student.remarks || "",
      }));

      const payload = {
        date: today,
        attendanceList: attendanceRecords,
        records: attendanceRecords,
      };

      const result = await apiCall("/attendance/bulk", "POST", payload);
      if (!result.success) {
        setErrorMsg(result.message || "Failed to save attendance.");
        return;
      }

      setSuccessMsg("Attendance successfully recorded for today!");
      await loadAttendance();

      setTimeout(() => {
        setSuccessMsg("");
      }, 4000);
    } catch (error) {
      console.error("Save attendance error:", error);
      setErrorMsg(error.message || "Unable to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  const presentCount = filteredStudents.filter(
    (s) => s.attendanceStatus === "PRESENT"
  ).length;
  const absentCount = filteredStudents.filter(
    (s) => s.attendanceStatus === "ABSENT"
  ).length;
  const lateCount = filteredStudents.filter(
    (s) => s.attendanceStatus === "LATE"
  ).length;

  return (
    <div className="space-y-5">
      {/* TOOLBAR HEADER */}
      <div className="bg-white/95 backdrop-blur-xs rounded-3xl border border-white shadow-[0_12px_30px_rgba(15,23,42,0.05)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] text-white shadow-md shadow-blue-500/30 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
              Daily Attendance Marking
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Date: <strong className="text-slate-800">{today}</strong> • Mark students present, absent, or late.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadAttendance}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-50"
          >
            <RotateCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleSaveAttendance}
            disabled={saving || loading}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white font-bold text-xs rounded-xl shadow-[0_6px_18px_rgba(37,99,235,0.35)] border-t border-white/25 transition active:scale-95 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving..." : "Save Today's Attendance"}</span>
          </button>
        </div>
      </div>

      {/* 3D SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#2563EB] to-[#3B82F6] text-white rounded-3xl p-5 shadow-[0_14px_30px_rgba(37,99,235,0.28)] border-t border-white/25 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-extrabold text-blue-100 uppercase tracking-wider">Cohort Total</p>
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-white tracking-tight tabular-nums mt-2">
            {filteredStudents.length}
          </h3>
          <p className="text-xs text-blue-100/85 mt-1.5">Students in view</p>
        </div>

        <div className="bg-gradient-to-br from-[#059669] to-[#34D399] text-white rounded-3xl p-5 shadow-[0_14px_30px_rgba(5,150,105,0.25)] border-t border-white/25 relative overflow-hidden">
          <p className="text-[11px] font-extrabold text-emerald-100 uppercase tracking-wider">Present</p>
          <h3 className="text-3xl font-extrabold text-white tracking-tight tabular-nums mt-2">
            {presentCount}
          </h3>
          <p className="text-xs text-emerald-100/85 mt-1.5">Marked present today</p>
        </div>

        <div className="bg-gradient-to-br from-[#EDE9FE] via-[#E0E7FF] to-[#DDD6FE] text-slate-900 rounded-3xl p-5 shadow-[0_12px_28px_rgba(99,102,241,0.14)] border border-white relative overflow-hidden">
          <p className="text-[11px] font-extrabold text-indigo-700 uppercase tracking-wider">Absent</p>
          <h3 className="text-3xl font-extrabold text-rose-600 tracking-tight tabular-nums mt-2">
            {absentCount}
          </h3>
          <p className="text-xs text-slate-600 mt-1.5">Unexcused or away</p>
        </div>

        <div className="bg-gradient-to-br from-[#FEF3C7] via-[#FDE68A]/80 to-[#FCD34D]/60 text-slate-900 rounded-3xl p-5 shadow-[0_12px_28px_rgba(245,158,11,0.16)] border border-white relative overflow-hidden">
          <p className="text-[11px] font-extrabold text-amber-800 uppercase tracking-wider">Late Arrivals</p>
          <h3 className="text-3xl font-extrabold text-amber-950 tracking-tight tabular-nums mt-2">
            {lateCount}
          </h3>
          <p className="text-xs text-amber-900/80 mt-1.5">Marked tardy today</p>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50/95 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-xs">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50/95 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* FILTER & QUICK ACTIONS */}
      <div className="bg-white/95 backdrop-blur-xs rounded-3xl border border-white shadow-[0_14px_34px_rgba(15,23,42,0.05)] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-700">Filter Course:</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
          >
            <option value="ALL">All Courses</option>
            {classes.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => markAll("PRESENT")}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold hover:bg-emerald-100 transition"
            >
              All Present
            </button>
            <button
              type="button"
              onClick={() => markAll("ABSENT")}
              className="px-3.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200/80 font-bold hover:bg-rose-100 transition"
            >
              All Absent
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs border-l border-slate-200 pl-3 tabular-nums">
            <span className="text-emerald-700 font-bold">P: {presentCount}</span>
            <span className="text-rose-600 font-bold">A: {absentCount}</span>
            <span className="text-amber-600 font-bold">L: {lateCount}</span>
          </div>
        </div>
      </div>

      {/* ATTENDANCE TABLE */}
      <div className="bg-white/95 backdrop-blur-xs rounded-3xl border border-white shadow-[0_14px_34px_rgba(15,23,42,0.05)] overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium text-slate-400">Loading student attendance...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">#</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Admission ID</th>
                  <th className="py-3.5 px-4">Course / Class</th>
                  <th className="py-3.5 px-4">Attendance Status</th>
                  <th className="py-3.5 px-5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, idx) => {
                    const currentStatus = student.attendanceStatus || "PRESENT";

                    return (
                      <tr key={student._id || idx} className="hover:bg-[#EFF6FF]/60 transition-colors">
                        <td className="py-3.5 px-5 text-slate-400 font-semibold tabular-nums">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {student.name}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {student.admissionNo}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium max-w-xs truncate">
                          {student.className}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200/80 p-1 bg-slate-100/80">
                            {["PRESENT", "ABSENT", "LATE"].map((status) => {
                              const isSelected = currentStatus === status;
                              return (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => handleStatusChange(student._id || student.id, status)}
                                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                                    isSelected
                                      ? status === "PRESENT"
                                        ? "bg-emerald-600 text-white shadow-sm"
                                        : status === "ABSENT"
                                        ? "bg-rose-600 text-white shadow-sm"
                                        : "bg-amber-500 text-white shadow-sm"
                                      : "bg-slate-100 text-slate-600 hover:bg-white hover:text-slate-900"
                                  }`}
                                >
                                  {status.charAt(0) + status.slice(1).toLowerCase()}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <input
                            type="text"
                            value={student.remarks || ""}
                            onChange={(e) => handleRemarksChange(student._id || student.id, e.target.value)}
                            placeholder="Optional remark..."
                            className="w-full max-w-xs bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                          />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-slate-400 font-medium">
                      No active students found in this course.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherAttendance;