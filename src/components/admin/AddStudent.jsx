import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CreditCard,
  Check,
  AlertCircle,
  KeyRound,
  Copy,
} from "lucide-react";
import { apiCall } from "../../services/api";

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

function AddStudent() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [idCardFileName, setIdCardFileName] = useState("");
  const [generatedCreds, setGeneratedCreds] = useState(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

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
    idCardPhoto: "",
    address: "",
    photo: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  const handleCourseToggle = (course) => {
    if (selectedCourses.includes(course)) {
      if (selectedCourses.length === 1) {
        setError("At least one course must be selected.");
        return;
      }
      setSelectedCourses(selectedCourses.filter((c) => c !== course));
    } else {
      setSelectedCourses([...selectedCourses, course]);
    }
  };

  const handleIdCardUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPG, PNG, WEBP).");
      return;
    }

    setIdCardFileName(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        idCardPhoto: reader.result,
      }));
      if (error) setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleCopyCredentials = () => {
    if (!generatedCreds) return;
    const text = `LocalPro1 Student Chat & Portal Login\nStudent: ${generatedCreds.name}\nAdmission ID: ${generatedCreds.admissionNo}\nEmail: ${generatedCreds.email}\nPassword: ${generatedCreds.password}`;
    navigator.clipboard.writeText(text);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setGeneratedCreds(null);

    const fullName = `${formData.firstName} ${formData.lastName}`
      .trim()
      .replace(/\s+/g, " ");

    // Only Student Name & Course are required; everything else is optional
    if (!fullName) {
      setError("Please enter student name.");
      return;
    }

    if (selectedCourses.length === 0) {
      setError("Please select at least one course.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Session expired. Please login again.");
        navigate("/login");
        return;
      }

      const studentPayload = {
        name: fullName,
        className: selectedCourses.join(", "),
        courses: selectedCourses,
        courseDuration: selectedDuration,
        section: (formData.section || "Morning").trim(),
        gender: formData.gender,
        status: formData.status,
      };

      if (formData.admissionNo.trim()) {
        studentPayload.admissionNo = formData.admissionNo.trim();
      }
      if (formData.rollNumber.trim()) {
        studentPayload.rollNo = formData.rollNumber.trim();
      }
      if (formData.fatherName.trim()) {
        studentPayload.parentName = formData.fatherName.trim();
      }
      if (formData.parentPhone.trim()) {
        studentPayload.parentPhone = formData.parentPhone.trim();
        studentPayload.parentWhatsApp = formData.parentPhone.trim();
      }
      if (formData.studentPhone.trim()) {
        studentPayload.studentPhone = formData.studentPhone.trim();
      }
      if (formData.cnic.trim()) {
        studentPayload.cnic = formData.cnic.trim();
      }
      if (formData.idCardPhoto) {
        studentPayload.idCardPhoto = formData.idCardPhoto;
      }
      if (formData.dob) {
        const parsedDob = parseDMYToISO(formData.dob);
        if (parsedDob) studentPayload.dateOfBirth = parsedDob;
      }
      if (formData.admissionDate.trim()) {
        const parsedAdmissionDate = parseDMYToISO(formData.admissionDate);
        if (parsedAdmissionDate) {
          studentPayload.admissionDate = parsedAdmissionDate;
        }
      }
      if (formData.address.trim()) {
        studentPayload.address = formData.address.trim();
      }
      if (formData.photo.trim()) {
        studentPayload.photo = formData.photo.trim();
      }

      const result = await apiCall("/students", "POST", studentPayload);

      if (!result.success) {
        setError(result.message || "Failed to save student.");
        return;
      }

      const createdStudent = result.data?.data?.student;
      const creds =
        result.data?.data?.loginCredentials || result.data?.data?.credentials;

      if (creds) {
        setGeneratedCreds({
          name: createdStudent?.name || fullName,
          admissionNo:
            createdStudent?.admissionNo ||
            formData.admissionNo.trim() ||
            "AUTO-ID",
          email: creds.email,
          password: creds.password,
        });
        setCopiedCreds(false);
        setSuccess(
          "Student registered & Student Portal/Chat login credentials generated!"
        );
      } else {
        setSuccess("Student successfully created and enrolled!");
        setTimeout(() => {
          navigate("/admin/students");
        }, 1000);
      }
    } catch (err) {
      setError(err.message || "Connection error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl border border-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
            Register New Student
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enter Student Name and select Course — all other fields and ID documents are optional.
          </p>
        </div>

        <button
          onClick={() => navigate("/admin/students")}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Students</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-medium flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-medium flex items-center gap-2.5">
          <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* AUTO-GENERATED CREDENTIALS BANNER */}
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
                  Copy and share these credentials with the student.
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
              onClick={() => navigate("/admin/students")}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition"
            >
              Go to Directory &rarr;
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-white p-6 sm:p-8 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* BASIC FIELDS (ONLY FIRST NAME REQUIRED) */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Student Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full bg-[#F8FAFC] border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full bg-[#F8FAFC] border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Admission No
              </label>
              <input
                type="text"
                name="admissionNo"
                value={formData.admissionNo}
                onChange={handleChange}
                className="w-full bg-[#F8FAFC] border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                placeholder="Auto-generated if empty"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Admission Date (DD/MM/YYYY)
              </label>
              <input
                type="text"
                name="admissionDate"
                value={formData.admissionDate}
                onChange={handleChange}
                className="w-full bg-[#F8FAFC] border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                placeholder="DD/MM/YYYY (e.g. 25/11/2026)"
              />
            </div>
          </div>

          {/* COURSES CHECKBOXES (REQUIRED) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Select Enrolled Courses ({selectedCourses.length} selected) *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-3.5 rounded-xl border border-slate-200 bg-slate-50">
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

          {/* OPTIONAL ID CARD BANNER */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white border border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                {formData.idCardPhoto ? (
                  <img
                    src={formData.idCardPhoto}
                    alt="CNIC"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <CreditCard className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Student ID Card / CNIC Copy (Optional)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {idCardFileName
                    ? `Attached: ${idCardFileName}`
                    : "Optional — attach if available."}
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleIdCardUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs rounded-xl shadow-2xs transition shrink-0"
            >
              Choose ID Document
            </button>
          </div>

          {/* DURATION SELECTOR */}
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
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>{dur}</span>
                </label>
              ))}
            </div>
          </div>

          {/* GUARDIAN & CONTACT (ALL OPTIONAL) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Father / Guardian Name
              </label>
              <input
                type="text"
                name="fatherName"
                value={formData.fatherName}
                onChange={handleChange}
                className="w-full bg-[#F8FAFC] border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Parent WhatsApp / Phone
              </label>
              <input
                type="text"
                name="parentPhone"
                value={formData.parentPhone}
                onChange={handleChange}
                className="w-full bg-[#F8FAFC] border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Student Phone
              </label>
              <input
                type="text"
                name="studentPhone"
                value={formData.studentPhone}
                onChange={handleChange}
                className="w-full bg-[#F8FAFC] border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                placeholder="Optional"
              />
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/students")}
              className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white font-bold text-xs rounded-xl transition shadow-[0_6px_18px_rgba(37,99,235,0.35)] border-t border-white/25 disabled:opacity-50"
            >
              {loading ? "Registering Student..." : "Register Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddStudent;