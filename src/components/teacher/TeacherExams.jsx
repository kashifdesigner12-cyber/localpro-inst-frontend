import React, { useEffect, useState } from "react";
import {
  RotateCw,
  Plus,
  Search,
  FileText,
  Calendar,
  Trash2,
  X,
  Check,
  AlertCircle,
  Clock,
  School,
} from "lucide-react";
import { apiCall } from "../../services/api";

function TeacherExams() {
  const today = new Date().toISOString().split("T")[0];

  const emptyForm = {
    name: "",
    examType: "MIDTERM",
    className: "",
    startDate: today,
    endDate: today,
    academicYear: "",
  };

  const [exams, setExams] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const examTypes = [
    { value: "MIDTERM", label: "Mid Term" },
    { value: "FINAL", label: "Final" },
    { value: "MONTHLY_TEST", label: "Monthly Test" },
    { value: "QUIZ", label: "Quiz" },
    { value: "ANNUAL", label: "Annual" },
    { value: "OTHER", label: "Other" },
  ];

  const loadExams = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const result = await apiCall("/exams", "GET");
      if (!result.success) {
        setErrorMsg(result.message || "Failed to load exams.");
        return;
      }
      setExams(result.data?.data?.exams || []);
    } catch (error) {
      console.error("Load exams error:", error);
      setErrorMsg(error.message || "Unable to load exams.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openModal = () => {
    setErrorMsg("");
    setSuccessMsg("");
    setFormData({
      ...emptyForm,
      startDate: today,
      endDate: today,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setErrorMsg("");
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!formData.name.trim()) {
      setErrorMsg("Exam name is required.");
      return;
    }
    if (!formData.className.trim()) {
      setErrorMsg("Class is required.");
      return;
    }
    if (!formData.startDate) {
      setErrorMsg("Start date is required.");
      return;
    }
    if (!formData.endDate) {
      setErrorMsg("End date is required.");
      return;
    }
    if (!formData.academicYear.trim()) {
      setErrorMsg("Academic year is required.");
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setErrorMsg("End date cannot be before start date.");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      examType: formData.examType || "MIDTERM",
      className: formData.className.trim(),
      startDate: formData.startDate,
      endDate: formData.endDate,
      academicYear: formData.academicYear.trim(),
    };

    setSaving(true);

    try {
      const result = await apiCall("/exams", "POST", payload);
      if (!result.success) {
        setErrorMsg(result.message || "Failed to create exam.");
        return;
      }

      setSuccessMsg("Examination schedule successfully registered!");
      closeModal();
      await loadExams();

      setTimeout(() => {
        setSuccessMsg("");
      }, 4000);
    } catch (error) {
      console.error("Create exam error:", error);
      setErrorMsg(error.message || "Unable to save exam.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExam = async (exam) => {
    if (!exam?._id && !exam?.id) return;
    const examId = exam._id || exam.id;
    const confirmed = window.confirm(`Delete exam "${exam.name}"?`);
    if (!confirmed) return;

    try {
      const result = await apiCall(`/exams/${examId}`, "DELETE");
      if (!result.success) {
        setErrorMsg(result.message || "Failed to delete exam.");
        return;
      }
      setSuccessMsg("Exam deleted successfully.");
      await loadExams();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      setErrorMsg(error.message || "Unable to delete exam.");
    }
  };

  const filteredExams = exams.filter((exam) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      (exam.name || "").toLowerCase().includes(q) ||
      (exam.className || "").toLowerCase().includes(q) ||
      (exam.examType || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* TOOLBAR HEADER */}
      <div className="bg-white/95 backdrop-blur-xs rounded-3xl border border-white shadow-[0_12px_30px_rgba(15,23,42,0.05)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] text-white shadow-md shadow-blue-500/30 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
              Examinations & Assessments
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Schedule midterms, quizzes, and practical finals for student cohorts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadExams}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-50"
          >
            <RotateCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>

          <button
            onClick={openModal}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white font-bold text-xs rounded-xl shadow-[0_6px_18px_rgba(37,99,235,0.35)] border-t border-white/25 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Exam</span>
          </button>
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

      {/* SEARCH BAR */}
      <div className="bg-white/95 backdrop-blur-xs rounded-3xl border border-white shadow-[0_14px_34px_rgba(15,23,42,0.05)] p-5">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search exam name or class..."
            className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
          />
        </div>
      </div>

      {/* EXAMS GRID */}
      {loading ? (
        <div className="text-center py-16 bg-white/95 backdrop-blur-xs rounded-3xl border border-white shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
          <div className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium text-slate-400">Loading scheduled examinations...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.length > 0 ? (
            filteredExams.map((exam) => {
              const examId = exam._id || exam.id;
              const startDate = exam.startDate ? new Date(exam.startDate).toLocaleDateString() : "-";
              const endDate = exam.endDate ? new Date(exam.endDate).toLocaleDateString() : "-";

              return (
                <div
                  key={examId}
                  className="bg-white/95 backdrop-blur-xs rounded-3xl border border-white hover:border-blue-200 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.05)] flex flex-col justify-between transition group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] text-white shadow-md shadow-blue-500/25 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                            {exam.name}
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#2563EB] border border-blue-200/70 mt-1">
                            {exam.examType || "MIDTERM"}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteExam(exam)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete Exam"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-3 pt-3.5 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Class:</span>
                        <strong className="text-slate-900">{exam.className}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Academic Year:</span>
                        <span className="font-mono font-semibold text-slate-700">{exam.academicYear || "2026"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Duration:</span>
                        <span className="text-slate-700 font-semibold">
                          {startDate} → {endDate}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-16 bg-white/95 backdrop-blur-xs rounded-3xl border border-white shadow-[0_14px_34px_rgba(15,23,42,0.05)] text-slate-400 text-xs font-medium">
              No examination schedules found. Click "Schedule Exam" to create one.
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          SCHEDULE EXAM MODAL
      ====================================================== */}
      {showModal && (
        <div className="fixed inset-0 bg-[#081529]/55 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-white shadow-[0_24px_60px_rgba(8,20,48,0.28)] overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Schedule Examination
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set examination title, test type, and evaluation date range.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Exam Title *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Mid-Term Practical Exam 2026"
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Exam Type</label>
                  <select
                    name="examType"
                    value={formData.examType}
                    onChange={handleInputChange}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                  >
                    {examTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Target Class *</label>
                  <input
                    type="text"
                    name="className"
                    value={formData.className}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. SEO"
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">End Date *</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Academic Year *</label>
                <input
                  type="text"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. 2026-2027"
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white font-bold text-xs rounded-xl shadow-[0_6px_18px_rgba(37,99,235,0.35)] border-t border-white/25 transition disabled:opacity-50"
                >
                  {saving ? "Scheduling..." : "Create Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherExams;
