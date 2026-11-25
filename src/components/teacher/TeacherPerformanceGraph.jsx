import React, { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  RotateCw,
  Search,
  Calendar,
  Award,
  AlertCircle,
  BarChart3,
  Layers,
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
  const monthIndex = Number(parts[1]) - 1;
  return MONTHS[monthIndex] || month;
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

const getBarColor = (percentage) => {
  const val = Number(percentage);
  if (val >= 80) return "bg-emerald-600";
  if (val >= 60) return "bg-teal-500";
  if (val >= 40) return "bg-amber-500";
  return "bg-rose-500";
};

function TeacherPerformanceGraph() {
  const [students, setStudents] = useState([]);
  const [performances, setPerformances] = useState([]);
  const [month, setMonth] = useState(getCurrentMonth());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      setPerformances(result.data?.data?.performances || []);
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

  const performanceMap = useMemo(() => {
    const map = {};
    performances.forEach((item) => {
      const studentId = item.student?._id || item.student;
      if (!studentId) return;
      map[String(studentId)] = item;
    });
    return map;
  }, [performances]);

  const studentPerformanceList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students
      .filter((s) => {
        if (!q) return true;
        const name = (s.name || "").toLowerCase();
        const adm = (s.admissionNo || "").toLowerCase();
        const cls = (s.className || "").toLowerCase();
        return name.includes(q) || adm.includes(q) || cls.includes(q);
      })
      .map((student) => {
        const id = String(student._id || student.id);
        const perf = performanceMap[id];
        const percentage = perf ? Number(perf.percentage) : null;
        return {
          ...student,
          percentage,
          remarks: perf?.remarks || "",
        };
      });
  }, [students, performanceMap, search]);

  const validScores = studentPerformanceList
    .map((s) => s.percentage)
    .filter((p) => p !== null && !Number.isNaN(p));

  const averageScore =
    validScores.length > 0
      ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
      : 0;

  const highestScore = validScores.length > 0 ? Math.max(...validScores) : 0;
  const lowestScore = validScores.length > 0 ? Math.min(...validScores) : 0;

  return (
    <div className="space-y-5">
      {/* TOOLBAR HEADER */}
      <div className="bg-white/95 backdrop-blur-xs rounded-3xl border border-white shadow-[0_12px_30px_rgba(15,23,42,0.05)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] text-white shadow-md shadow-blue-500/30 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
              Performance Analytics & Trends
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparative performance charts for <strong className="text-slate-800">{getMonthName(month)}</strong>.
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

      {error && (
        <div className="p-3.5 bg-rose-50/95 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#2563EB] to-[#3B82F6] text-white rounded-3xl p-5 shadow-[0_14px_30px_rgba(37,99,235,0.28)] border-t border-white/25 relative overflow-hidden">
          <p className="text-[11px] font-extrabold text-blue-100 uppercase tracking-wider">Average Score</p>
          <h3 className="text-3xl font-extrabold text-white tracking-tight tabular-nums mt-2">
            {averageScore}%
          </h3>
          <p className="text-xs text-blue-100/85 mt-1.5">Cohort average for {getMonthName(month)}</p>
        </div>

        <div className="bg-gradient-to-br from-[#059669] to-[#34D399] text-white rounded-3xl p-5 shadow-[0_14px_30px_rgba(5,150,105,0.25)] border-t border-white/25 relative overflow-hidden">
          <p className="text-[11px] font-extrabold text-emerald-100 uppercase tracking-wider">Highest Score</p>
          <h3 className="text-3xl font-extrabold text-white tracking-tight tabular-nums mt-2">
            {highestScore}%
          </h3>
          <p className="text-xs text-emerald-100/85 mt-1.5">Top performer result</p>
        </div>

        <div className="bg-gradient-to-br from-[#FEF3C7] via-[#FDE68A]/80 to-[#FCD34D]/60 text-slate-900 rounded-3xl p-5 shadow-[0_12px_28px_rgba(245,158,11,0.16)] border border-white relative overflow-hidden">
          <p className="text-[11px] font-extrabold text-amber-800 uppercase tracking-wider">Lowest Score</p>
          <h3 className="text-3xl font-extrabold text-rose-700 tracking-tight tabular-nums mt-2">
            {lowestScore}%
          </h3>
          <p className="text-xs text-amber-900/80 mt-1.5">Cutoff threshold result</p>
        </div>

        <div className="bg-gradient-to-br from-[#EDE9FE] via-[#E0E7FF] to-[#DDD6FE] text-slate-900 rounded-3xl p-5 shadow-[0_12px_28px_rgba(99,102,241,0.14)] border border-white relative overflow-hidden">
          <p className="text-[11px] font-extrabold text-indigo-700 uppercase tracking-wider">Evaluated</p>
          <h3 className="text-3xl font-extrabold text-indigo-950 tracking-tight tabular-nums mt-2">
            {validScores.length} / {students.length}
          </h3>
          <p className="text-xs text-slate-600 mt-1.5">Graded students in roster</p>
        </div>
      </div>

      {/* FILTER & MONTH PICKER */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/95 backdrop-blur-xs rounded-3xl border border-white shadow-[0_14px_34px_rgba(15,23,42,0.05)] p-5">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student or class..."
            className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <span className="text-xs text-slate-700 font-bold">Month:</span>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
          />
        </div>
      </div>

      {/* VISUAL BAR CHART BARS */}
      <div className="bg-white/95 backdrop-blur-xs rounded-3xl border border-white shadow-[0_14px_34px_rgba(15,23,42,0.05)] p-6 space-y-5">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Student Performance Distribution ({getMonthName(month)})
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-400 font-mono bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200/70">0% — 100% Scale</span>
        </div>

        <div className="space-y-4">
          {studentPerformanceList.length > 0 ? (
            studentPerformanceList.map((student) => {
              const score = student.percentage;
              const hasScore = score !== null && !Number.isNaN(score);
              const label = hasScore ? getPerformanceLabel(score) : "Not Graded";

              return (
                <div key={student._id || student.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">{student.name}</span>
                      <span className="text-[11px] font-mono text-slate-400">({student.admissionNo})</span>
                      <span className="text-[11px] font-medium text-slate-500">• {student.className}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-900 tabular-nums">
                        {hasScore ? `${score}%` : "—"}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{label}</span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        hasScore ? getBarColor(score) : "bg-transparent"
                      }`}
                      style={{ width: `${hasScore ? Math.min(100, Math.max(0, score)) : 0}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center py-10 text-xs text-slate-400 font-medium">
              No students found in current search.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeacherPerformanceGraph;
