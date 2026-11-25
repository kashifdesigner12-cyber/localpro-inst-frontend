import React, { useEffect, useMemo, useState } from "react";
import {
  RotateCw,
  Search,
  Check,
  AlertCircle,
  Copy,
  X,
  User,
  Key,
  GraduationCap,
} from "lucide-react";
import { apiCall, API_BASE_URL } from "../../services/api";

function TeacherStudents() {
  const serverOrigin = API_BASE_URL.replace(/\/api\/?$/, "");

  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [generatingCredsId, setGeneratingCredsId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  const loadStudents = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const result = await apiCall("/students?limit=100", "GET");
      if (!result.success) {
        setErrorMsg(result.message || "Failed to load students.");
        return;
      }
      setStudents(result.data?.data?.students || []);
    } catch (error) {
      console.error("Load teacher students error:", error);
      setErrorMsg(error.message || "Unable to load students.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const classOptions = useMemo(() => {
    const classes = students.map((student) => student.className).filter(Boolean);
    return [...new Set(classes)].sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return students.filter((student) => {
      const name = student.name || "";
      const admissionNo = student.admissionNo || "";
      const className = student.className || "";
      const section = student.section || "";
      const email = student.email || "";

      const matchesSearch =
        !search ||
        name.toLowerCase().includes(search) ||
        admissionNo.toLowerCase().includes(search) ||
        className.toLowerCase().includes(search) ||
        section.toLowerCase().includes(search) ||
        email.toLowerCase().includes(search);

      const matchesClass = classFilter === "ALL" || className === classFilter;
      return matchesSearch && matchesClass;
    });
  }, [students, searchTerm, classFilter]);

  const handleCopyCredentials = (creds) => {
    const text = `LocalPro1 Student Chat & Portal Login\nStudent: ${creds.name}\nAdmission ID: ${creds.admissionNo}\nEmail: ${creds.email}\nPassword: ${creds.password}`;
    navigator.clipboard?.writeText(text);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2500);
  };

  const handleGenerateStudentCredentials = async (student) => {
    if (!student?._id) return;
    setGeneratingCredsId(student._id);
    setErrorMsg("");

    try {
      const result = await apiCall(
        `/students/${student._id}/generate-credentials`,
        "POST"
      );

      if (!result.success) {
        setErrorMsg(result.message || "Failed to generate student credentials.");
        return;
      }

      const creds =
        result.data?.data?.loginCredentials || result.data?.data?.credentials;
      const updatedStudent = result.data?.data?.student;

      if (updatedStudent) {
        setStudents((prev) =>
          prev.map((item) =>
            item._id === updatedStudent._id ? updatedStudent : item
          )
        );
      }

      if (creds) {
        setCreatedCredentials({
          name: student.name,
          admissionNo: student.admissionNo,
          email: creds.email,
          password: creds.password,
        });
        setCopiedCreds(false);
      }

      setSuccessMsg(`Login credentials generated for ${student.name}!`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (error) {
      setErrorMsg(error.message || "Unable to generate credentials.");
    } finally {
      setGeneratingCredsId("");
    }
  };

  const getStudentPhotoUrl = (photo) => {
    if (!photo) return "";
    if (
      photo.startsWith("http://") ||
      photo.startsWith("https://") ||
      photo.startsWith("data:")
    ) {
      return photo;
    }
    return `${serverOrigin}${photo}`;
  };

  return (
    <div className="space-y-5">
      {/* TOP PAGE HEADER BANNER (VIEW-ONLY ROSTER FOR TEACHER) */}
      <div className="bg-white/95 backdrop-blur-xs rounded-3xl border border-white shadow-[0_12px_30px_rgba(15,23,42,0.05)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] text-white shadow-md shadow-blue-500/30 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Student Roster
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#2563EB] border border-blue-200/70">
                {students.length} Total
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Faculty view of enrolled students, course allocations, and messaging access.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={loadStudents}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl shadow-2xs transition active:scale-95 disabled:opacity-50"
          >
            <RotateCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* CREDENTIALS BANNER */}
      {createdCredentials && (
        <div className="rounded-2xl bg-gradient-to-r from-[#EFF6FF] via-[#DBEAFE]/80 to-[#E0F2FE] border border-blue-200/80 shadow-[0_8px_24px_rgba(37,99,235,0.10)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900">
                Student Chat Portal Login Ready — {createdCredentials.name} ({createdCredentials.admissionNo})
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 bg-white border border-blue-200 rounded-xl px-3 py-1.5 font-mono text-xs font-bold text-slate-800 shadow-2xs">
                  <span className="text-slate-400 font-sans text-[11px] font-medium">
                    ID / Email:
                  </span>
                  <span className="text-[#2563EB]">
                    {createdCredentials.email}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white border border-blue-200 rounded-xl px-3 py-1.5 font-mono text-xs font-bold text-slate-800 shadow-2xs">
                  <span className="text-slate-400 font-sans text-[11px] font-medium">
                    Password:
                  </span>
                  <span className="text-emerald-700">
                    {createdCredentials.password}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleCopyCredentials(createdCredentials)}
              className="inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition"
            >
              {copiedCreds ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Credentials</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setCreatedCredentials(null)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-blue-100/60 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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

      {/* SEARCH & STUDENTS TABLE CARD */}
      <div className="bg-white/95 rounded-3xl border border-white shadow-[0_14px_34px_rgba(15,23,42,0.05)] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search students by name, ID, class..."
              className="w-full bg-[#F1F5F9] border border-slate-200/80 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-semibold">
              Filter Class:
            </span>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
            >
              <option value="ALL">All Classes</option>
              {classOptions.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium text-slate-400">
              Loading student roster...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Admission ID</th>
                  <th className="py-3.5 px-4">Portal Email</th>
                  <th className="py-3.5 px-4">Class / Course</th>
                  <th className="py-3.5 px-4">Guardian Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Portal Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => {
                    const photoUrl = getStudentPhotoUrl(student.photo);
                    const status = String(
                      student.status || "ACTIVE"
                    ).toUpperCase();

                    return (
                      <tr
                        key={student._id}
                        className="hover:bg-[#EFF6FF]/60 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
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
                            <div>
                              <span className="font-bold text-slate-900 block">
                                {student.name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {student.section}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {student.admissionNo}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {student.email ? (
                            <span className="text-[#2563EB] font-semibold">
                              {student.email}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">
                              Not generated
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-700 font-semibold max-w-xs truncate">
                          {student.className}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">
                            {student.parentName || "-"}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {student.parentPhone ||
                              student.parentWhatsApp ||
                              "-"}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold border ${
                              status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                                : "bg-rose-50 text-rose-700 border-rose-200/80"
                            }`}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              handleGenerateStudentCredentials(student)
                            }
                            disabled={generatingCredsId === student._id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/70 font-bold text-xs transition disabled:opacity-50"
                            title="Generate / Reset Portal & Chat Login Password"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>
                              {generatingCredsId === student._id
                                ? "..."
                                : "Login"}
                            </span>
                          </button>
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
                      No matching student records found.
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

export default TeacherStudents;