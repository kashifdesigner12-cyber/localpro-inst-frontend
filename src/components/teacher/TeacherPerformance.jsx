import React, { useEffect, useMemo, useState } from "react";
import {
  PenTool,
  RotateCw,
  Save,
  Search,
  Check,
  AlertCircle,
  Calendar,
  Award,
} from "lucide-react";
import { apiCall } from "../../services/api";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const getMonthName = (month) => {
  if (!month) return "";
  const parts = month.split("-");
  if (parts.length !== 2) return month;
  const index = Number(parts[1]) - 1;
  return MONTHS[index] || month;
};

const getPerformanceLabel = (percentage) => {
  const value = Number(percentage);
  if (Number.isNaN(value)) return "";
  if (value >= 90) return "Excellent";
  if (value >= 80) return "Very Good";
  if (value >= 70) return "Good";
  if (value >= 60) return "Satisfactory";
  if (value >= 50) return "Needs Improvement";
  return "Needs Attention";
};

const getPerformanceBadge = (percentage) => {
  const value = Number(percentage);
  if (Number.isNaN(value)) return "bg-slate-100 text-slate-600 border-slate-200";
  if (value >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (value >= 60) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
};

function TeacherPerformance() {
  const [students, setStudents] = useState([]);
  const [performances, setPerformances] = useState([]);
  const [month, setMonth] = useState(getCurrentMonth());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingStudent, setSavingStudent] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({});

  const loadStudents = async () => {
    try {
      const result = await apiCall("/students?limit=100", "GET");
      if (!result.success) {
        setError(result.message || "Failed to load students.");
        return;
      }
      setStudents(result.data?.data?.students || []);
    } catch (err) {
      console.error("Load students error:", err);
      setError("Unable to load students.");
    }
  };

  const loadPerformance = async () => {
    try {
      const result = await apiCall(`/performance?month=${month}`, "GET");
      if (!result.success) {
        setError(result.message || "Failed to load performance.");
        return;
      }

      const list = result.data?.data?.performances || [];
      setPerformances(list);

      const newFormData = {};
      list.forEach((item) => {
        const studentId = item.student?._id || item.student;
        if (!studentId) return;
        newFormData[String(studentId)] = {
          percentage:
            item.percentage !== undefined && item.percentage !== null
              ? String(item.percentage)
              : "",
          remarks: item.remarks || "",
        };
      });
      setFormData(newFormData);
    } catch (err) {
      console.error("Load performance error:", err);
      setError("Unable to load performance data.");
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      await loadStudents();
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!month) return;
    loadPerformance();
  }, [month]);

  const handlePercentageChange = (studentId, value) => {
    if (value === "") {
      setFormData((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          percentage: "",
        },
      }));
      return;
    }
    const num = Number(value);
    if (Number.isNaN(num) || num < 0 || num > 100) return;

    setFormData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        percentage: value,
      },
    }));
  };

  const handleRemarksChange = (studentId, value) => {
    setFormData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks: value,
      },
    }));
  };

  const handleSaveStudent = async (student) => {
    const studentId = String(student._id || student.id);
    const data = formData[studentId] || {};
    const percentage = Number(data.percentage);

    if (data.percentage === "" || Number.isNaN(percentage)) {
      setError(`Please enter a valid percentage for ${student.name}.`);
      return;
    }

    try {
      setSavingStudent(studentId);
      setError("");
      setMessage("");

      const payload = {
        studentId,
        month,
        percentage,
        remarks: data.remarks || "",
      };

      const result = await apiCall("/performance", "POST", payload);
      if (!result.success) {
        setError(result.message || "Failed to save performance.");
        return;
      }

      setMessage(`Performance for ${student.name} saved successfully.`);
      await loadPerformance();
      setTimeout(() => setMessage(""), 3500);
    } catch (err) {
      console.error("Save performance error:", err);
      setError(err.message || "Failed to save performance.");
    } finally {
      setSavingStudent("");
    }
  };

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const name = (s.name || "").toLowerCase();
      const adm = (s.admissionNo || "").toLowerCase();
      const cls = (s.className || "").toLowerCase();
      return name.includes(q) || adm.includes(q) || cls.includes(q);
    });
  }, [students, search]);

  return (
    <div className="space-y-5">
      {/* TOOLBAR HEADER */}
      <div className="bg-white/95 backdrop-blur-xs rounded-3xl border border-white shadow-[0_12px_30px_rgba(15,23,42,0.05)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] text-white shadow-md shadow-blue-500/30 flex items-center justify-center shrink-0">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
              Student Marks & Evaluation Entry
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Input assessment percentages, monthly evaluation remarks, and calibrated grade indicators.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              loadStudents();
              loadPerformance();
            }}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-50"
          >
            <RotateCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      {message && (
        <div className="p-3.5 bg-emerald-50/95 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-xs">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50/95 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* CONTROLS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/95 backdrop-blur-xs rounded-3xl border border-white shadow-[0_14px_34px_rgba(15,23,42,0.05)] p-5">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student or admission ID..."
            className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <span className="text-xs text-slate-700 font-bold">Evaluation Month:</span>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
          />
        </div>
      </div>

      {/* PERFORMANCE MARKS TABLE */}
      <div className="bg-white/95 backdrop-blur-xs rounded-3xl border border-white shadow-[0_14px_34px_rgba(15,23,42,0.05)] overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium text-slate-400">Loading student rosters for evaluation...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">Student</th>
                  <th className="py-3.5 px-4">Admission ID</th>
                  <th className="py-3.5 px-4">Class</th>
                  <th className="py-3.5 px-4 w-32">Score (%)</th>
                  <th className="py-3.5 px-4">Calibrated Grade</th>
                  <th className="py-3.5 px-4">Teacher Feedback Remarks</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => {
                    const studentId = String(student._id || student.id);
                    const current = formData[studentId] || { percentage: "", remarks: "" };
                    const label = getPerformanceLabel(current.percentage);
                    const isSaving = savingStudent === studentId;

                    return (
                      <tr key={studentId} className="hover:bg-[#EFF6FF]/60 transition-colors">
                        <td className="py-3.5 px-5 font-bold text-slate-900">
                          {student.name}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {student.admissionNo}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium max-w-xs truncate">
                          {student.className}
                        </td>
                        <td className="py-3.5 px-4">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={current.percentage}
                            onChange={(e) => handlePercentageChange(studentId, e.target.value)}
                            placeholder="0-100"
                            className="w-24 bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-extrabold tabular-nums focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                          />
                        </td>
                        <td className="py-3.5 px-4">
                          {label ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getPerformanceBadge(current.percentage)}`}>
                              {label}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Unrated</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <input
                            type="text"
                            value={current.remarks}
                            onChange={(e) => handleRemarksChange(studentId, e.target.value)}
                            placeholder="e.g. Excellent progress in code assignments"
                            className="w-full max-w-xs bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                          />
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            type="button"
                            onClick={() => handleSaveStudent(student)}
                            disabled={isSaving}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white font-bold text-xs rounded-xl shadow-[0_6px_18px_rgba(37,99,235,0.35)] border-t border-white/25 transition active:scale-95 disabled:opacity-50"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{isSaving ? "Saving..." : "Save"}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-400 font-medium">
                      No matching students found for marks entry.
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

export default TeacherPerformance;
