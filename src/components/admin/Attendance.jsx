import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  RotateCw,
  Save,
  Check,
  AlertCircle,
  Clock,
  UserX,
  Users,
  Search,
  User,
} from "lucide-react";
import { apiCall, API_BASE_URL } from "../../services/api";

function Attendance() {
  const today = new Date().toISOString().split("T")[0];

  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const [monthlyClass, setMonthlyClass] = useState("");
  const [monthlyYear, setMonthlyYear] = useState(
    String(new Date().getFullYear())
  );
  const [monthlyMonth, setMonthlyMonth] = useState(
    String(new Date().getMonth())
  );

  const [monthlyStats, setMonthlyStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
  });

  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingMonthly, setLoadingMonthly] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const statusOptions = [
    { value: "PRESENT", label: "Present" },
    { value: "ABSENT", label: "Absent" },
    { value: "LATE", label: "Late" },
    { value: "LEAVE", label: "Leave" },
  ];

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const getPhotoUrl = (photo) => {
    if (!photo) return "";
    if (
      photo.startsWith("http://") ||
      photo.startsWith("https://") ||
      photo.startsWith("data:")
    ) {
      return photo;
    }
    return `${API_BASE_URL.replace("/api", "")}${photo}`;
  };

  const loadStudents = async () => {
    setLoadingStudents(true);
    setErrorMsg("");

    try {
      const result = await apiCall("/students?page=1&limit=100", "GET");
      if (!result.success) {
        setErrorMsg(result.message || "Failed to load students.");
        return;
      }

      const list = result.data?.data?.students || [];
      const activeStudents = list.filter(
        (student) =>
          String(student.status || "ACTIVE").toUpperCase() === "ACTIVE"
      );
      setStudents(activeStudents);

      if (activeStudents.length > 0) {
        const uniqueClasses = [
          ...new Set(
            activeStudents.map((student) => student.className).filter(Boolean)
          ),
        ];
        if (!monthlyClass && uniqueClasses.length > 0) {
          setMonthlyClass(uniqueClasses[0]);
        }
      }
    } catch (error) {
      console.error("Load students error:", error);
      setErrorMsg(error.message || "Unable to load students from backend.");
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const classOptions = useMemo(() => {
    return [
      ...new Set(students.map((student) => student.className).filter(Boolean)),
    ].sort();
  }, [students]);

  const sectionOptions = useMemo(() => {
    const source = selectedClass
      ? students.filter(
          (student) =>
            String(student.className).toLowerCase() ===
            String(selectedClass).toLowerCase()
        )
      : students;

    return [
      ...new Set(source.map((student) => student.section).filter(Boolean)),
    ].sort();
  }, [students, selectedClass]);

  const monthlyClassOptions = classOptions;

  // Cohort filtered by Class + Section + Search (before status pill filter)
  const cohortStudents = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return students.filter((student) => {
      const sameClass =
        !selectedClass ||
        String(student.className).toLowerCase() ===
          String(selectedClass).toLowerCase();
      const sameSection =
        !selectedSection ||
        String(student.section).toLowerCase() ===
          String(selectedSection).toLowerCase();
      const matchesSearch =
        !q ||
        student.name?.toLowerCase().includes(q) ||
        student.admissionNo?.toLowerCase().includes(q) ||
        student.className?.toLowerCase().includes(q);

      return sameClass && sameSection && matchesSearch;
    });
  }, [students, selectedClass, selectedSection, searchTerm]);

  const loadAttendance = async () => {
    if (!selectedDate) return;

    setLoadingAttendance(true);
    setErrorMsg("");

    try {
      let endpoint = `/attendance/date/${selectedDate}?page=1&limit=100`;
      if (selectedClass) {
        endpoint += `&className=${encodeURIComponent(selectedClass)}`;
      }
      if (selectedSection) {
        endpoint += `&section=${encodeURIComponent(selectedSection)}`;
      }

      const result = await apiCall(endpoint, "GET");
      if (!result.success) {
        setErrorMsg(result.message || "Failed to load attendance.");
        return;
      }

      const data = result.data?.data || {};
      const records = data.attendance || [];
      const nextMap = {};

      records.forEach((record) => {
        const studentId = record.student?._id || record.student;
        if (!studentId) return;
        nextMap[String(studentId)] = {
          status: String(record.status || "PRESENT").toUpperCase(),
          remarks: record.remarks || "",
          isMarked: true,
        };
      });

      setAttendanceMap(nextMap);
    } catch (error) {
      console.error("Load attendance error:", error);
      setErrorMsg(error.message || "Unable to load attendance records.");
    } finally {
      setLoadingAttendance(false);
    }
  };

  useEffect(() => {
    if (students.length > 0) {
      loadAttendance();
    }
  }, [selectedDate, selectedClass, selectedSection, students.length]);

  // Live counts across current cohort
  const liveCounts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;
    let unmarked = 0;

    cohortStudents.forEach((student) => {
      const rec = attendanceMap[String(student._id)];
      if (!rec || !rec.status) {
        unmarked += 1;
      } else if (rec.status === "PRESENT") {
        present += 1;
      } else if (rec.status === "ABSENT") {
        absent += 1;
      } else if (rec.status === "LATE") {
        late += 1;
      } else if (rec.status === "LEAVE") {
        leave += 1;
      }
    });

    return {
      total: cohortStudents.length,
      present,
      absent,
      late,
      leave,
      unmarked,
    };
  }, [cohortStudents, attendanceMap]);

  // Final list displayed in table after statusFilter pill
  const displayedStudents = useMemo(() => {
    if (statusFilter === "ALL") return cohortStudents;

    return cohortStudents.filter((student) => {
      const rec = attendanceMap[String(student._id)];
      if (statusFilter === "UNMARKED") {
        return !rec || !rec.status;
      }
      if (statusFilter === "LATE_LEAVE") {
        return rec?.status === "LATE" || rec?.status === "LEAVE";
      }
      return rec?.status === statusFilter;
    });
  }, [cohortStudents, attendanceMap, statusFilter]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [String(studentId)]: {
        ...prev[String(studentId)],
        status,
        isMarked: true,
      },
    }));
  };

  const handleRemarksChange = (studentId, remarks) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [String(studentId)]: {
        ...prev[String(studentId)],
        status: prev[String(studentId)]?.status || "PRESENT",
        remarks,
      },
    }));
  };

  const markAll = (status) => {
    const nextMap = { ...attendanceMap };
    cohortStudents.forEach((student) => {
      const id = String(student._id);
      nextMap[id] = {
        ...nextMap[id],
        status,
        isMarked: true,
      };
    });
    setAttendanceMap(nextMap);
  };

  const handleSaveAttendance = async () => {
    if (cohortStudents.length === 0) {
      setErrorMsg("No students available to mark attendance.");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const attendanceRecords = cohortStudents.map((student) => {
        const id = String(student._id);
        const current = attendanceMap[id] || {};
        return {
          studentId: id,
          status: current.status || "PRESENT",
          remarks: (current.remarks || "").trim(),
        };
      });

      const payload = {
        date: selectedDate,
        attendanceList: attendanceRecords,
        records: attendanceRecords,
      };

      const result = await apiCall("/attendance/bulk", "POST", payload);
      if (!result.success) {
        setErrorMsg(result.message || "Failed to save attendance.");
        return;
      }

      setSuccessMsg("Attendance records successfully saved and verified!");
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

  const loadMonthlyReport = async () => {
    if (!monthlyClass) return;

    setLoadingMonthly(true);
    setErrorMsg("");

    try {
      const endpoint = `/attendance/monthly?className=${encodeURIComponent(
        monthlyClass
      )}&year=${monthlyYear}&month=${monthlyMonth}`;
      const result = await apiCall(endpoint, "GET");

      if (!result.success) {
        return;
      }

      const data = result.data?.data || {};
      const backendStats = data.stats || data.summary || {};

      setMonthlyStats({
        total: Number(backendStats.total || 0),
        present: Number(backendStats.present || 0),
        absent: Number(backendStats.absent || 0),
        late: Number(backendStats.late || 0),
        leave: Number(backendStats.leave || 0),
      });
    } catch (error) {
      console.error("Load monthly error:", error);
    } finally {
      setLoadingMonthly(false);
    }
  };

  useEffect(() => {
    if (monthlyClass) {
      loadMonthlyReport();
    }
  }, [monthlyClass, monthlyYear, monthlyMonth]);

  return (
    <div className="space-y-5">
      {/* TOP PAGE HEADER BANNER */}
      <div className="bg-white/95 backdrop-blur-xs rounded-3xl border border-white shadow-[0_12px_30px_rgba(15,23,42,0.05)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] text-white shadow-md shadow-blue-500/30 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Attendance Records & Ledger
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitor daily Present/Absent students by date, course, or status filter.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={loadAttendance}
            disabled={loadingAttendance}
            className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl shadow-2xs transition active:scale-95 disabled:opacity-50"
          >
            <RotateCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleSaveAttendance}
            disabled={saving || loadingAttendance}
            className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-[0_6px_18px_rgba(37,99,235,0.35)] border-t border-white/25 transition active:scale-95 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving..." : "Save Attendance"}</span>
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-medium flex items-center gap-2.5">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-medium flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 3D CLICKABLE SUMMARY KPI STRIP (CLICK ANY CARD TO FILTER LIST) */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={`text-left rounded-3xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] text-white p-4 shadow-[0_12px_28px_rgba(37,99,235,0.28)] border-t border-white/30 flex items-center gap-3.5 transition ${
            statusFilter === "ALL" ? "ring-4 ring-blue-300/60 scale-[1.01]" : "opacity-95 hover:opacity-100"
          }`}
        >
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/30 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-blue-100 font-medium">Total Students</p>
            <h3 className="text-2xl font-extrabold tabular-nums">{liveCounts.total}</h3>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("PRESENT")}
          className={`text-left rounded-3xl bg-gradient-to-br from-[#059669] to-[#34D399] text-white p-4 shadow-[0_12px_28px_rgba(16,185,129,0.26)] border-t border-white/30 flex items-center gap-3.5 transition ${
            statusFilter === "PRESENT" ? "ring-4 ring-emerald-300/60 scale-[1.01]" : "opacity-95 hover:opacity-100"
          }`}
        >
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/30 flex items-center justify-center shrink-0">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-emerald-50 font-medium">Present</p>
            <h3 className="text-2xl font-extrabold tabular-nums">{liveCounts.present}</h3>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("ABSENT")}
          className={`text-left rounded-3xl bg-gradient-to-br from-[#EDE9FE] via-[#E0E7FF] to-[#DDD6FE] text-slate-900 p-4 shadow-[0_10px_25px_rgba(99,102,241,0.12)] border border-white flex items-center gap-3.5 transition ${
            statusFilter === "ABSENT" ? "ring-4 ring-rose-300/70 scale-[1.01]" : "hover:scale-[1.01]"
          }`}
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#E11D48] to-[#F43F5E] text-white shadow-md shadow-rose-500/30 flex items-center justify-center shrink-0">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-600 font-semibold">Absent</p>
            <h3 className="text-2xl font-extrabold text-rose-600 tabular-nums">{liveCounts.absent}</h3>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("LATE_LEAVE")}
          className={`text-left rounded-3xl bg-gradient-to-br from-[#FEF3C7] via-[#FDE68A]/80 to-[#FCD34D]/60 text-slate-900 p-4 shadow-[0_10px_25px_rgba(245,158,11,0.14)] border border-white flex items-center gap-3.5 transition ${
            statusFilter === "LATE_LEAVE" ? "ring-4 ring-amber-300/70 scale-[1.01]" : "hover:scale-[1.01]"
          }`}
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#D97706] to-[#F59E0B] text-white shadow-md shadow-amber-500/30 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-700 font-semibold">Late / Leave</p>
            <h3 className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {liveCounts.late + liveCounts.leave}
            </h3>
          </div>
        </button>
      </div>

      {/* FILTER BAR: DATE, CLASS, SECTION, SEARCH & STATUS TABS */}
      <div className="bg-white/95 backdrop-blur-xs rounded-3xl border border-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.05)] space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Class / Course
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
            >
              <option value="">All Classes / Courses</option>
              {classOptions.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
            >
              <option value="">All Sections</option>
              {sectionOptions.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Search Student
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name or Admission ID..."
                className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-medium text-slate-800 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* STATUS FILTER PILLS + QUICK MARK */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {/* Filter by Present / Absent / Late / Not Marked */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-bold mr-1">Filter Status:</span>

            {[
              { id: "ALL", label: `All (${liveCounts.total})`, activeClass: "bg-[#0C234B] text-white shadow-xs" },
              { id: "PRESENT", label: `Present (${liveCounts.present})`, activeClass: "bg-emerald-600 text-white shadow-xs" },
              { id: "ABSENT", label: `Absent (${liveCounts.absent})`, activeClass: "bg-rose-600 text-white shadow-xs" },
              { id: "LATE", label: `Late (${liveCounts.late})`, activeClass: "bg-amber-500 text-white shadow-xs" },
              { id: "LEAVE", label: `Leave (${liveCounts.leave})`, activeClass: "bg-[#2563EB] text-white shadow-xs" },
              { id: "UNMARKED", label: `Not Marked (${liveCounts.unmarked})`, activeClass: "bg-slate-700 text-white shadow-xs" },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setStatusFilter(pill.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  statusFilter === pill.id
                    ? pill.activeClass
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold">Quick Mark:</span>
            <button
              type="button"
              onClick={() => markAll("PRESENT")}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold hover:bg-emerald-100 transition"
            >
              All Present
            </button>
            <button
              type="button"
              onClick={() => markAll("ABSENT")}
              className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200/80 font-bold hover:bg-rose-100 transition"
            >
              All Absent
            </button>
          </div>
        </div>
      </div>

      {/* ATTENDANCE SHEET TABLE */}
      <div className="bg-white/95 rounded-3xl border border-white shadow-[0_14px_34px_rgba(15,23,42,0.05)] overflow-hidden">
        {loadingStudents || loadingAttendance ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium text-slate-400">
              Loading student attendance sheet...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Admission ID</th>
                  <th className="py-3.5 px-4">Course / Section</th>
                  <th className="py-3.5 px-4">Current Status</th>
                  <th className="py-3.5 px-4">Mark / Update</th>
                  <th className="py-3.5 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedStudents.length > 0 ? (
                  displayedStudents.map((student, idx) => {
                    const current = attendanceMap[String(student._id)];
                    const currentStatus = current?.status || "";
                    const photoUrl = getPhotoUrl(student.photo);

                    return (
                      <tr
                        key={student._id}
                        className={`transition-colors ${
                          currentStatus === "ABSENT"
                            ? "bg-rose-50/35 hover:bg-rose-50/60"
                            : "hover:bg-[#EFF6FF]/60"
                        }`}
                      >
                        <td className="py-3.5 px-4 text-slate-400 font-semibold tabular-nums">
                          {idx + 1}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                              {photoUrl ? (
                                <img
                                  src={photoUrl}
                                  alt={student.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <span className="font-bold text-slate-900">
                              {student.name}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {student.admissionNo}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          <span className="block max-w-[200px] truncate text-slate-800 font-semibold">
                            {student.className || "-"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {student.section || "Morning"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {currentStatus ? (
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold border ${
                                currentStatus === "PRESENT"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : currentStatus === "ABSENT"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : currentStatus === "LATE"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-blue-50 text-[#2563EB] border-blue-200"
                              }`}
                            >
                              {currentStatus}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                              NOT MARKED
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200/80 p-1 bg-slate-50">
                            {statusOptions.map((opt) => {
                              const isSelected = currentStatus === opt.value;
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() =>
                                    handleStatusChange(student._id, opt.value)
                                  }
                                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                                    isSelected
                                      ? opt.value === "PRESENT"
                                        ? "bg-emerald-600 text-white shadow-sm"
                                        : opt.value === "ABSENT"
                                        ? "bg-rose-600 text-white shadow-sm"
                                        : opt.value === "LATE"
                                        ? "bg-amber-500 text-white shadow-sm"
                                        : "bg-[#2563EB] text-white shadow-sm"
                                      : "bg-slate-100 text-slate-600 hover:text-slate-900"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <input
                            type="text"
                            value={current?.remarks || ""}
                            onChange={(e) =>
                              handleRemarksChange(student._id, e.target.value)
                            }
                            placeholder="Optional remark..."
                            className="w-full max-w-[180px] bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                          />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center py-12 text-slate-400 font-medium"
                    >
                      No students found matching the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MONTHLY SUMMARY CARD */}
      <div className="bg-white/95 backdrop-blur-xs rounded-3xl border border-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.05)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Monthly Attendance Analytics
            </h3>
            <p className="text-xs text-slate-500">
              Aggregated monthly attendance summary by class batch.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={monthlyClass}
              onChange={(e) => setMonthlyClass(e.target.value)}
              className="bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
            >
              {monthlyClassOptions.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>

            <select
              value={monthlyMonth}
              onChange={(e) => setMonthlyMonth(e.target.value)}
              className="bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
            >
              {months.map((m, idx) => (
                <option key={m} value={idx}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={monthlyYear}
              onChange={(e) => setMonthlyYear(e.target.value)}
              className="bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
            >
              {[2024, 2025, 2026, 2027].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-center">
            <span className="text-[11px] text-slate-500 uppercase font-semibold">
              Total Sessions
            </span>
            <p className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">
              {monthlyStats.total}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100 text-center">
            <span className="text-[11px] text-emerald-700 uppercase font-semibold">
              Total Present
            </span>
            <p className="text-xl font-bold text-emerald-700 tabular-nums mt-0.5">
              {monthlyStats.present}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-rose-50/50 border border-rose-100 text-center">
            <span className="text-[11px] text-rose-700 uppercase font-semibold">
              Total Absent
            </span>
            <p className="text-xl font-bold text-rose-600 tabular-nums mt-0.5">
              {monthlyStats.absent}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-100 text-center">
            <span className="text-[11px] text-amber-700 uppercase font-semibold">
              Late
            </span>
            <p className="text-xl font-bold text-amber-600 tabular-nums mt-0.5">
              {monthlyStats.late}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100 text-center">
            <span className="text-[11px] text-blue-700 uppercase font-semibold">
              Leave
            </span>
            <p className="text-xl font-bold text-blue-600 tabular-nums mt-0.5">
              {monthlyStats.leave}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Attendance;