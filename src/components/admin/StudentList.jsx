import React, { useEffect, useState, useRef } from "react";
import {
  RotateCw,
  Plus,
  Search,
  Eye,
  Trash2,
  X,
  Upload,
  Check,
  AlertCircle,
  ExternalLink,
  GraduationCap,
  CreditCard,
  User,
  KeyRound,
  Copy,
} from "lucide-react";
import { apiCall, API_BASE_URL } from "../../services/api";

// Format Date or DD/MM/YYYY safely to DD/MM/YYYY
const formatDateDMY = (input) => {
  if (!input) return "-";
  if (typeof input === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(input.trim())) {
    return input.trim();
  }
  const d = new Date(input);
  if (isNaN(d.getTime())) return String(input);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// Convert DD/MM/YYYY to ISO date string for backend API
const parseDMYToISO = (dmyStr) => {
  if (!dmyStr || !dmyStr.trim()) return "";
  const clean = dmyStr.trim();
  const match = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return clean;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const year = parseInt(match[3], 10);
  const dateObj = new Date(Date.UTC(year, month, day));
  if (isNaN(dateObj.getTime())) return "";
  return dateObj.toISOString();
};

function StudentList() {
  const idCardInputRef = useRef(null);

  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // View Details Modal State
  const [viewingStudent, setViewingStudent] = useState(null);

  // Generated Student Portal & Chat Credentials Banner State
  const [generatedCreds, setGeneratedCreds] = useState(null);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [generatingCredsId, setGeneratingCredsId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const [idCardFile, setIdCardFile] = useState(null);
  const [idCardPreview, setIdCardPreview] = useState("");
  const [idCardFileName, setIdCardFileName] = useState("");

  // All 23 Courses
  const allCourses = [
    "Digital marketing",
    "Artificial Intelligence",
    "Coding with python",
    "Google Adsense",
    "Meta Ads/Google Ads",
    "Wordpress+SEO",
    "Generative AI",
    "IT Support, Hardware & Networking Basics",
    "Graphic Design",
    "Freelancing",
    "Ai Content Creation",
    "Basic Computer",
    "DIT(1 Year)",
    "Data Analytics",
    "Full Stack Development",
    "SEO",
    "Web Development",
    "Prompt Engineering",
    "Microsoft courses",
    "Ecommerce",
    "Content & Copy Writing",
    "Amazon Virtual Assistant",
    "Spoken English",
  ];

  const durationOptions = [
    "1 Month",
    "2 Months",
    "3 Months",
    "6 Months",
    "1 Year",
  ];

  const [selectedCourses, setSelectedCourses] = useState(["SEO"]);
  const [selectedDuration, setSelectedDuration] = useState("3 Months");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    admissionNo: "",
    gender: "Male",
    dob: "",
    admissionDate: "",
    status: "Active",
    section: "Morning",
    rollNumber: "",
    fatherName: "",
    parentPhone: "",
    studentPhone: "",
    cnic: "",
    address: "",
    email: "",
    password: "",
  });

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      admissionNo: "",
      gender: "Male",
      dob: "",
      admissionDate: "",
      status: "Active",
      section: "Morning",
      rollNumber: "",
      fatherName: "",
      parentPhone: "",
      studentPhone: "",
      cnic: "",
      address: "",
      email: "",
      password: "",
    });

    setSelectedCourses(["SEO"]);
    setSelectedDuration("3 Months");

    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview("");

    setIdCardFile(null);
    if (idCardPreview) URL.revokeObjectURL(idCardPreview);
    setIdCardPreview("");
    setIdCardFileName("");
  };

  const loadStudents = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const result = await apiCall("/students?page=1&limit=100", "GET");

      if (!result.success) {
        setErrorMsg(result.message || "Failed to load students.");
        return;
      }

      const studentList = result.data?.data?.students || [];
      setStudents(studentList);
    } catch (error) {
      setErrorMsg(error.message || "Unable to load students.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();

    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      if (idCardPreview) URL.revokeObjectURL(idCardPreview);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCourseToggle = (course) => {
    if (selectedCourses.includes(course)) {
      if (selectedCourses.length === 1) {
        setErrorMsg("At least one course must be selected.");
        return;
      }
      setSelectedCourses(selectedCourses.filter((c) => c !== course));
    } else {
      setSelectedCourses([...selectedCourses, course]);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Invalid image. Only JPG, PNG, WEBP are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Student photo size must be 5 MB or less.");
      e.target.value = "";
      return;
    }

    setErrorMsg("");
    if (photoPreview) URL.revokeObjectURL(photoPreview);

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleIdCardChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Invalid ID Card format. Upload an image file.");
      e.target.value = "";
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg("ID Card size must be 8 MB or less.");
      e.target.value = "";
      return;
    }

    setErrorMsg("");
    setIdCardFileName(file.name);
    if (idCardPreview) URL.revokeObjectURL(idCardPreview);

    setIdCardFile(file);
    setIdCardPreview(URL.createObjectURL(file));
  };

  const handleOpenModal = () => {
    setErrorMsg("");
    setSuccessMsg("");
    resetForm();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (saving) return;
    setShowModal(false);
    setErrorMsg("");
    resetForm();
  };

  const handleCopyCredentials = () => {
    if (!generatedCreds) return;
    const text = `LocalPro1 Student Chat & Portal Login\nStudent: ${generatedCreds.name}\nAdmission ID: ${generatedCreds.admissionNo}\nEmail: ${generatedCreds.email}\nPassword: ${generatedCreds.password}`;
    navigator.clipboard.writeText(text);
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
        setGeneratedCreds({
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

  const handleAddStudent = async (e) => {
    e.preventDefault();

    setErrorMsg("");
    setSuccessMsg("");

    const fullName = `${formData.firstName} ${formData.lastName}`
      .trim()
      .replace(/\s+/g, " ");

    // Only Student Name & Course are required; everything else is optional
    if (!fullName) {
      setErrorMsg("Please enter student name.");
      return;
    }

    if (selectedCourses.length === 0) {
      setErrorMsg("Please select at least one course.");
      return;
    }

    setSaving(true);

    try {
      const payload = new FormData();
      payload.append("name", fullName);
      payload.append("className", selectedCourses.join(", "));
      payload.append("courseDuration", selectedDuration);
      payload.append("section", (formData.section || "Morning").trim());
      payload.append("gender", formData.gender.toUpperCase());
      payload.append("status", formData.status.toUpperCase());

      if (formData.admissionNo.trim()) {
        payload.append("admissionNo", formData.admissionNo.trim());
      }

      if (formData.rollNumber.trim()) {
        payload.append("rollNo", formData.rollNumber.trim());
      }

      if (formData.fatherName.trim()) {
        payload.append("parentName", formData.fatherName.trim());
      }

      if (formData.parentPhone.trim()) {
        payload.append("parentPhone", formData.parentPhone.trim());
        payload.append("parentWhatsApp", formData.parentPhone.trim());
      }

      if (formData.studentPhone.trim()) {
        payload.append("studentPhone", formData.studentPhone.trim());
      }

      if (formData.cnic.trim()) {
        payload.append("cnic", formData.cnic.trim());
      }

      if (formData.address.trim()) {
        payload.append("address", formData.address.trim());
      }

      if (formData.dob) {
        const parsedDob = parseDMYToISO(formData.dob);
        if (parsedDob) payload.append("dateOfBirth", parsedDob);
      }

      if (formData.admissionDate.trim()) {
        const parsedAdmissionDate = parseDMYToISO(formData.admissionDate);
        if (parsedAdmissionDate) {
          payload.append("admissionDate", parsedAdmissionDate);
        }
      }

      if (formData.email.trim()) {
        payload.append("email", formData.email.trim());
      }

      if (formData.password.trim()) {
        payload.append("password", formData.password.trim());
      }

      if (photoFile) {
        payload.append("photo", photoFile);
      }

      if (idCardFile) {
        payload.append("idCard", idCardFile);
      }

      const result = await apiCall("/students", "POST", payload);

      if (!result.success) {
        setErrorMsg(result.message || "Failed to add student.");
        return;
      }

      const newStudent = result.data?.data?.student;
      const loginCredentials =
        result.data?.data?.loginCredentials || result.data?.data?.credentials;

      if (newStudent) {
        setStudents((prev) => [newStudent, ...prev]);
      } else {
        await loadStudents();
      }

      if (loginCredentials) {
        setGeneratedCreds({
          name: newStudent?.name || fullName,
          admissionNo:
            newStudent?.admissionNo ||
            formData.admissionNo.trim() ||
            "AUTO-ID",
          email: loginCredentials.email,
          password: loginCredentials.password,
        });
        setCopiedCreds(false);
      }

      setShowModal(false);
      setSuccessMsg(
        "Student registered & Student Portal/Chat login credentials generated!"
      );
      resetForm();

      setTimeout(() => {
        setSuccessMsg("");
      }, 5000);
    } catch (error) {
      setErrorMsg(error.message || "Unable to connect to backend.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStudent = async (student) => {
    if (!student?._id) return;

    const confirmed = window.confirm(`Delete student "${student.name}"?`);
    if (!confirmed) return;

    setErrorMsg("");
    setSuccessMsg("");
    setDeletingId(student._id);

    try {
      const result = await apiCall(`/students/${student._id}`, "DELETE");

      if (!result.success) {
        setErrorMsg(result.message || "Failed to delete student.");
        return;
      }

      setStudents((prev) => prev.filter((item) => item._id !== student._id));
      setSuccessMsg("Student record removed successfully.");

      setTimeout(() => {
        setSuccessMsg("");
      }, 4000);
    } catch (error) {
      setErrorMsg(error.message || "Unable to delete student.");
    } finally {
      setDeletingId("");
    }
  };

  const getMediaUrl = (path) => {
    if (!path) return "";
    if (
      path.startsWith("http://") ||
      path.startsWith("https://") ||
      path.startsWith("data:")
    ) {
      return path;
    }
    return `${API_BASE_URL.replace("/api", "")}${path}`;
  };

  const filteredStudents = students.filter((s) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      s.name?.toLowerCase().includes(q) ||
      s.admissionNo?.toLowerCase().includes(q) ||
      s.cnic?.toLowerCase().includes(q) ||
      s.className?.toLowerCase().includes(q) ||
      s.parentName?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* TOP PAGE HEADER BANNER (3D ELEVATED WHITE/SKY CARD) */}
      <div className="bg-white/95 backdrop-blur-xs rounded-3xl border border-white shadow-[0_12px_30px_rgba(15,23,42,0.05)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] text-white shadow-md shadow-blue-500/30 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Student Directory
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#2563EB] border border-blue-200/70">
                {students.length} Total
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage student registrations, academic courses, and Student Portal/Chat credentials.
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

          <button
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-[0_6px_18px_rgba(37,99,235,0.35)] border-t border-white/25 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Student</span>
          </button>
        </div>
      </div>

      {/* AUTO-GENERATED STUDENT PORTAL & CHAT CREDENTIALS BANNER */}
      {generatedCreds && (
        <div className="rounded-2xl bg-gradient-to-r from-[#EFF6FF] via-[#DBEAFE]/80 to-[#E0F2FE] border border-blue-200/90 shadow-[0_8px_24px_rgba(37,99,235,0.12)] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#2563EB] text-white flex items-center justify-center shrink-0">
                <KeyRound className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">
                  Student Portal & Chat Login Credentials — {generatedCreds.name} ({generatedCreds.admissionNo})
                </h4>
                <p className="text-[11px] text-slate-600">
                  Share these credentials with the student to log in to the Student Chat & Task Portal.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="bg-white border border-blue-200 rounded-xl px-3 py-1.5 font-mono text-xs font-bold text-slate-800 shadow-2xs">
                Email:{" "}
                <span className="text-[#2563EB]">{generatedCreds.email}</span>
              </span>
              <span className="bg-white border border-blue-200 rounded-xl px-3 py-1.5 font-mono text-xs font-bold text-slate-800 shadow-2xs">
                Password:{" "}
                <span className="text-emerald-700">
                  {generatedCreds.password}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyCredentials}
              className="inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition"
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
              onClick={() => setGeneratedCreds(null)}
              className="p-2 rounded-xl bg-white/80 hover:bg-white text-slate-500 border border-blue-200/70 transition"
              title="Dismiss"
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

      {errorMsg && !showModal && !viewingStudent && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-medium flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SEARCH & DIRECTORY TABLE CARD */}
      <div className="bg-white/95 rounded-3xl border border-white shadow-[0_14px_34px_rgba(15,23,42,0.05)] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search student name, admission ID, CNIC..."
              className="w-full bg-[#F1F5F9] border border-slate-200/80 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition"
            />
          </div>

          <span className="text-xs font-bold text-slate-500">
            {filteredStudents.length} student
            {filteredStudents.length === 1 ? "" : "s"} listed
          </span>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium text-slate-400">
              Loading student directory...
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
                  <th className="py-3.5 px-4">Guardian & Contact</th>
                  <th className="py-3.5 px-4">Enrolled Course(s)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => {
                    const photoUrl = getMediaUrl(student.photo);
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
                            <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                              {photoUrl ? (
                                <img
                                  src={photoUrl}
                                  alt={student.name || "Student"}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <User className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">
                                {student.name || "-"}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {student.cnic || "No CNIC"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {student.admissionNo || "-"}
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

                        <td className="py-3.5 px-4 text-slate-600">
                          <div className="font-semibold text-slate-800">
                            {student.parentName || "-"}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {student.parentWhatsApp ||
                              student.parentPhone ||
                              "-"}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate font-medium">
                          {student.className || "-"}
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
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleGenerateStudentCredentials(student)
                              }
                              disabled={generatingCredsId === student._id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/70 font-bold text-xs transition disabled:opacity-50"
                              title="Generate / Reset Portal & Chat Login Password"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>
                                {generatingCredsId === student._id
                                  ? "..."
                                  : "Login"}
                              </span>
                            </button>

                            <button
                              onClick={() => setViewingStudent(student)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#2563EB] font-bold text-xs transition"
                              title="View Full Profile & ID Card"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>

                            <button
                              onClick={() => handleDeleteStudent(student)}
                              disabled={deletingId === student._id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs transition disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>
                                {deletingId === student._id ? "..." : "Delete"}
                              </span>
                            </button>
                          </div>
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

      {/* =====================================================
          VIEW STUDENT DETAILS MODAL
      ====================================================== */}
      {viewingStudent && (
        <div className="fixed inset-0 bg-[#081529]/55 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-3xl bg-white rounded-3xl border border-white shadow-[0_24px_60px_rgba(8,20,48,0.28)] max-h-[92vh] overflow-y-auto p-6 space-y-5">
            {/* Modal Header */}
            <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Student Record Overview
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Admission ID:{" "}
                  <span className="text-[#2563EB] font-bold">
                    {viewingStudent.admissionNo}
                  </span>
                  {viewingStudent.email && (
                    <>
                      {" "}
                      • Portal Email:{" "}
                      <span className="text-emerald-700 font-bold">
                        {viewingStudent.email}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingStudent(null)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-5">
              {/* Profile Top Banner */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="w-20 h-20 rounded-xl bg-white shadow-xs overflow-hidden flex items-center justify-center border border-slate-200 shrink-0">
                  {getMediaUrl(viewingStudent.photo) ? (
                    <img
                      src={getMediaUrl(viewingStudent.photo)}
                      alt={viewingStudent.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <h2 className="text-lg font-bold text-slate-900">
                      {viewingStudent.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {viewingStudent.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">
                    Gender:{" "}
                    <strong className="text-slate-700">
                      {viewingStudent.gender || "Male"}
                    </strong>{" "}
                    • Section:{" "}
                    <strong className="text-slate-700">
                      {viewingStudent.section || "-"}
                    </strong>{" "}
                    • Roll No:{" "}
                    <strong className="text-slate-700">
                      {viewingStudent.rollNo || "-"}
                    </strong>
                  </p>

                  <p className="text-xs text-slate-500 font-mono">
                    CNIC / B-Form:{" "}
                    <span className="text-slate-800 font-bold">
                      {viewingStudent.cnic || "Not Provided"}
                    </span>
                  </p>
                </div>
              </div>

              {/* ID CARD / CNIC COPY */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-[#2563EB]" />
                    ID Card / CNIC Document (Optional)
                  </h4>
                  {(viewingStudent.idCardPhoto || viewingStudent.idCard) && (
                    <a
                      href={getMediaUrl(
                        viewingStudent.idCardPhoto || viewingStudent.idCard
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-[#2563EB] hover:text-blue-700 flex items-center gap-1"
                    >
                      <span>Full View</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <div className="w-full min-h-[160px] max-h-[340px] rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-200 p-2">
                  {viewingStudent.idCardPhoto || viewingStudent.idCard ? (
                    <img
                      src={getMediaUrl(
                        viewingStudent.idCardPhoto || viewingStudent.idCard
                      )}
                      alt="Student ID Card Copy"
                      className="max-h-[320px] w-auto max-w-full object-contain rounded shadow-xs"
                      onError={(e) => {
                        e.currentTarget.src = "";
                        e.currentTarget.alt = "Failed to load ID card image";
                      }}
                    />
                  ) : (
                    <p className="text-xs font-medium text-slate-400">
                      No ID Card Image uploaded for this student.
                    </p>
                  )}
                </div>
              </div>

              {/* Detailed Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Academic Details */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <h4 className="text-[11px] font-semibold uppercase text-slate-700 tracking-wider pb-1 border-b border-slate-200">
                    Academic Enrollment
                  </h4>
                  <p>
                    <span className="text-slate-500 block">
                      Enrolled Courses:
                    </span>
                    <strong className="text-slate-900 block mt-0.5">
                      {viewingStudent.className}
                    </strong>
                  </p>
                  <p>
                    <span className="text-slate-500">Duration:</span>
                    <strong className="text-[#2563EB] ml-1.5">
                      {viewingStudent.courseDuration || "3 Months"}
                    </strong>
                  </p>
                  <p>
                    <span className="text-slate-500">Admission Date:</span>
                    <span className="text-slate-700 ml-1.5 font-mono font-semibold">
                      {formatDateDMY(viewingStudent.admissionDate)}
                    </span>
                  </p>
                </div>

                {/* Guardian & Contact */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <h4 className="text-[11px] font-semibold uppercase text-slate-700 tracking-wider pb-1 border-b border-slate-200">
                    Guardian & Contact Info
                  </h4>
                  <p>
                    <span className="text-slate-500">Father / Guardian:</span>
                    <strong className="text-slate-900 ml-1.5">
                      {viewingStudent.parentName || "-"}
                    </strong>
                  </p>
                  <p>
                    <span className="text-slate-500">WhatsApp / Phone:</span>
                    <span className="font-mono text-slate-800 font-semibold ml-1.5">
                      {viewingStudent.parentWhatsApp ||
                        viewingStudent.parentPhone ||
                        "-"}
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-500 block">Address:</span>
                    <span className="text-slate-700 block mt-0.5 font-medium">
                      {viewingStudent.address || "No address provided."}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const s = viewingStudent;
                  setViewingStudent(null);
                  handleGenerateStudentCredentials(s);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs transition"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Generate / Reset Portal Login</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingStudent(null)}
                className="bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-[0_6px_18px_rgba(37,99,235,0.35)] border-t border-white/25 transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          ADD STUDENT MODAL (ONLY NAME & COURSE REQUIRED)
      ====================================================== */}
      {showModal && (
        <div className="fixed inset-0 bg-[#081529]/55 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-3xl bg-white rounded-3xl border border-white shadow-[0_24px_60px_rgba(8,20,48,0.28)] max-h-[92vh] overflow-y-auto p-6">
            {/* Modal Header */}
            <div className="pb-4 mb-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Register New Student
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter Student Name and select Course — all other fields and documents are optional.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={saving}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddStudent} className="space-y-5">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Personal Info Grid (Only First Name is required) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Admission No
                  </label>
                  <input
                    type="text"
                    name="admissionNo"
                    value={formData.admissionNo}
                    onChange={handleInputChange}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-mono placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CNIC / B-Form
                  </label>
                  <input
                    type="text"
                    name="cnic"
                    value={formData.cnic}
                    onChange={handleInputChange}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-mono placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Course Multi-select checkboxes (Required) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Select Enrolled Courses ({selectedCourses.length} selected) *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-3 rounded-xl border border-slate-200 bg-slate-50">
                  {allCourses.map((course) => {
                    const isChecked = selectedCourses.includes(course);
                    return (
                      <label
                        key={course}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                          isChecked
                            ? "bg-blue-50 border-blue-300 text-blue-900 font-semibold"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleCourseToggle(course)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="truncate">{course}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* OPTIONAL PHOTO & ID CARD UPLOAD */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Photo (Optional) */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-xl bg-white border border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Student Photo (Optional)
                    </span>
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 font-medium text-xs rounded-lg hover:bg-slate-50 transition shadow-2xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* ID Card (Optional) */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-xl bg-white border border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                    {idCardPreview ? (
                      <img
                        src={idCardPreview}
                        alt="ID Card"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <CreditCard className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      ID Card / CNIC Copy (Optional)
                    </span>
                    <input
                      ref={idCardInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleIdCardChange}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          idCardInputRef.current && idCardInputRef.current.click()
                        }
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-lg transition shadow-2xs"
                      >
                        Upload ID Card
                      </button>
                      <span className="text-[11px] text-slate-500 truncate max-w-[140px]">
                        {idCardFileName || "Optional"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status & Timing (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Section
                  </label>
                  <select
                    name="section"
                    value={formData.section}
                    onChange={handleInputChange}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Weekend">Weekend</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Admission Date (DD/MM/YYYY)
                  </label>
                  <input
                    type="text"
                    name="admissionDate"
                    value={formData.admissionDate}
                    onChange={handleInputChange}
                    placeholder="DD/MM/YYYY (e.g. 25/11/2026)"
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-mono placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Course Duration Selector */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Course Duration
                </label>
                <div className="flex flex-wrap gap-4">
                  {durationOptions.map((dur) => (
                    <label
                      key={dur}
                      className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700"
                    >
                      <input
                        type="radio"
                        name="courseDuration"
                        value={dur}
                        checked={selectedDuration === dur}
                        onChange={(e) => setSelectedDuration(e.target.value)}
                        className="text-[#2563EB] focus:ring-blue-500"
                      />
                      <span>{dur}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Guardian & Contact (All Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Father / Guardian Name
                  </label>
                  <input
                    type="text"
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleInputChange}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Parent WhatsApp / Phone
                  </label>
                  <input
                    type="text"
                    name="parentPhone"
                    value={formData.parentPhone}
                    onChange={handleInputChange}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-mono placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Phone
                  </label>
                  <input
                    type="text"
                    name="studentPhone"
                    value={formData.studentPhone}
                    onChange={handleInputChange}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-mono placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Optional Custom Portal & Chat Login Credentials */}
              <div className="p-4 rounded-xl border border-blue-200/80 bg-[#EFF6FF]/60 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Login Email (Optional)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-mono placeholder:text-slate-400 focus:border-[#2563EB] outline-none transition"
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Login Password (Optional)
                  </label>
                  <input
                    type="text"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-mono placeholder:text-slate-400 focus:border-[#2563EB] outline-none transition"
                    placeholder="Auto-generated if empty"
                  />
                </div>
              </div>

              {/* Address (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Residential Address (Optional)
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                  placeholder="Optional"
                />
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-[0_6px_18px_rgba(37,99,235,0.35)] border-t border-white/25 transition disabled:opacity-50"
                >
                  {saving ? "Registering Student..." : "Register Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentList;