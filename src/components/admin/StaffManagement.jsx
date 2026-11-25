import React, { useEffect, useState } from "react";
import {
  RotateCw,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Copy,
  Check,
  AlertCircle,
  Key,
  Mail,
  Phone,
  Briefcase,
  Building,
  DollarSign,
  Calendar,
  Lock,
  Upload,
  User,
  Users,
} from "lucide-react";
import { apiCall } from "../../services/api";

function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    designation: "",
    department: "",
    salary: "",
    joiningDate: "",
    status: "ACTIVE",
    photo: "",
    password: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      designation: "",
      department: "",
      salary: "",
      joiningDate: "",
      status: "ACTIVE",
      photo: "",
      password: "",
    });
    setEditingStaff(null);
  };

  const loadStaff = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setErrorMsg("Please login first.");
        return;
      }

      const result = await apiCall("/staff", "GET");
      if (!result.success) {
        setErrorMsg(result.message || "Failed to load staff.");
        return;
      }

      const staffList = result.data?.data?.staff || [];
      setStaff(Array.isArray(staffList) ? staffList : []);
    } catch (error) {
      setErrorMsg(error.message || "Unable to load staff.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        photo: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleOpenModal = () => {
    resetForm();
    setErrorMsg("");
    setSuccessMsg("");
    setShowModal(true);
  };

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember?.name || "",
      email: staffMember?.email || "",
      phone: staffMember?.phone || "",
      designation: staffMember?.designation || "",
      department: staffMember?.department || "",
      salary:
        staffMember?.salary !== undefined && staffMember?.salary !== null
          ? String(staffMember.salary)
          : "",
      joiningDate: staffMember?.joiningDate
        ? new Date(staffMember.joiningDate).toISOString().split("T")[0]
        : "",
      status: staffMember?.status || "ACTIVE",
      photo: staffMember?.photo || "",
      password: "",
    });

    setErrorMsg("");
    setSuccessMsg("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (saving) return;
    setShowModal(false);
    setErrorMsg("");
    resetForm();
  };

  const handleCopyCredentials = (name, email, password) => {
    const text = `LocalPro1 Teacher Portal Login\nName: ${name}\nEmail: ${email}\nPassword: ${password}`;
    navigator.clipboard?.writeText(text);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();
    const designation = formData.designation.trim();
    const department = formData.department.trim();

    if (!name) {
      setErrorMsg("Please enter staff name.");
      return;
    }
    if (!email) {
      setErrorMsg("Please enter staff email.");
      return;
    }
    if (!phone) {
      setErrorMsg("Please enter staff phone.");
      return;
    }
    if (!designation) {
      setErrorMsg("Please enter designation.");
      return;
    }
    if (!department) {
      setErrorMsg("Please enter department.");
      return;
    }
    if (formData.password && formData.password.trim().length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    const staffPayload = {
      name,
      email,
      phone,
      designation,
      department,
      salary: formData.salary === "" ? 0 : Number(formData.salary),
      joiningDate: formData.joiningDate || undefined,
      status: formData.status.toUpperCase(),
      photo: formData.photo || "",
      ...(formData.password.trim() ? { password: formData.password.trim() } : {}),
    };

    setSaving(true);

    try {
      let result;
      if (editingStaff?._id) {
        result = await apiCall(`/staff/${editingStaff._id}`, "PUT", staffPayload);
      } else {
        result = await apiCall("/staff", "POST", staffPayload);
      }

      if (!result.success) {
        setErrorMsg(result.message || "Failed to save staff.");
        return;
      }

      setShowModal(false);

      const creds = result.data?.data?.credentials;
      const savedStaff = result.data?.data?.staff;

      if (!editingStaff && creds) {
        setCreatedCredentials({
          name: savedStaff?.name || name,
          email: creds.email,
          password: creds.password,
        });
      } else if (editingStaff && formData.password.trim()) {
        setCreatedCredentials({
          name: savedStaff?.name || name,
          email: savedStaff?.email || email,
          password: formData.password.trim(),
        });
      }

      setSuccessMsg(
        editingStaff
          ? "Staff successfully updated!"
          : "Staff created & Teacher Portal login credentials generated!"
      );

      resetForm();
      await loadStaff();

      setTimeout(() => {
        setSuccessMsg("");
      }, 4000);
    } catch (error) {
      setErrorMsg(error.message || "Unable to connect to backend.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (staffMember) => {
    if (!staffMember?._id) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${staffMember.name}"?`
    );
    if (!confirmed) return;

    setDeletingId(staffMember._id);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const result = await apiCall(`/staff/${staffMember._id}`, "DELETE");
      if (!result.success) {
        setErrorMsg(result.message || "Failed to delete staff.");
        return;
      }

      setStaff((prev) => prev.filter((item) => item._id !== staffMember._id));
      setSuccessMsg("Staff member removed successfully!");

      setTimeout(() => {
        setSuccessMsg("");
      }, 4000);
    } catch (error) {
      setErrorMsg(error.message || "Unable to delete staff.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRefresh = () => {
    setSuccessMsg("");
    setErrorMsg("");
    loadStaff();
  };

  const filteredStaff = staff.filter((staffMember) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      String(staffMember?.name || "").toLowerCase().includes(q) ||
      String(staffMember?.email || "").toLowerCase().includes(q) ||
      String(staffMember?.phone || "").toLowerCase().includes(q) ||
      String(staffMember?.designation || "").toLowerCase().includes(q) ||
      String(staffMember?.department || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* TOP PAGE HEADER BANNER (3D ELEVATED WHITE/SKY CARD) */}
      <div className="bg-white/95 backdrop-blur-xs rounded-3xl border border-white shadow-[0_12px_30px_rgba(15,23,42,0.05)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] text-white shadow-md shadow-blue-500/30 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Staff & Faculty Management
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#2563EB] border border-blue-200/70">
                {staff.length} Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage teacher profiles, department designations, and portal access accounts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleRefresh}
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
            <span>+ Add Staff</span>
          </button>
        </div>
      </div>

      {/* GENERATED TEACHER LOGIN CREDENTIALS BANNER */}
      {createdCredentials && (
        <div className="rounded-2xl bg-gradient-to-r from-[#EFF6FF] via-[#DBEAFE]/80 to-[#E0F2FE] border border-blue-200/80 shadow-[0_8px_24px_rgba(37,99,235,0.10)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900">
                Teacher Portal Login Credentials Ready — {createdCredentials.name}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 bg-white border border-blue-200 rounded-xl px-3 py-1.5 font-mono text-xs font-bold text-slate-800 shadow-2xs">
                  <span className="text-slate-400 font-sans text-[11px] font-medium">Email:</span>
                  <span className="text-[#2563EB]">{createdCredentials.email}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white border border-blue-200 rounded-xl px-3 py-1.5 font-mono text-xs font-bold text-slate-800 shadow-2xs">
                  <span className="text-slate-400 font-sans text-[11px] font-medium">Password:</span>
                  <span className="text-[#2563EB]">{createdCredentials.password}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                handleCopyCredentials(
                  createdCredentials.name,
                  createdCredentials.email,
                  createdCredentials.password
                )
              }
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

      {errorMsg && !showModal && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-medium flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SEARCH & DATA TABLE CARD */}
      <div className="bg-white/95 rounded-3xl border border-white shadow-[0_14px_34px_rgba(15,23,42,0.05)] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search faculty name, email, department..."
              className="w-full bg-[#F1F5F9] border border-slate-200/80 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition"
            />
          </div>

          <span className="text-xs font-bold text-slate-500">
            {filteredStaff.length} faculty member{filteredStaff.length === 1 ? "" : "s"} listed
          </span>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium text-slate-400">Loading faculty list...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Faculty Member</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Designation</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Monthly Salary</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.length > 0 ? (
                  filteredStaff.map((staffMember) => {
                    const status = String(staffMember.status || "ACTIVE").toUpperCase();

                    return (
                      <tr key={staffMember._id} className="hover:bg-[#EFF6FF]/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center font-bold text-slate-600 text-xs">
                              {staffMember.photo ? (
                                <img
                                  src={staffMember.photo}
                                  alt={staffMember.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                (staffMember.name || "S").charAt(0).toUpperCase()
                              )}
                            </div>
                            <span className="font-bold text-slate-900">{staffMember.name}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {staffMember.email}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {staffMember.phone}
                        </td>

                        <td className="py-3.5 px-4 text-slate-700 font-semibold">
                          {staffMember.designation}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          {staffMember.department}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-800 tabular-nums">
                          Rs {Number(staffMember.salary || 0).toLocaleString()}
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
                              onClick={() => handleEdit(staffMember)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#2563EB] font-bold text-xs transition"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => handleDelete(staffMember)}
                              disabled={deletingId === staffMember._id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs transition disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{deletingId === staffMember._id ? "..." : "Delete"}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-slate-400 font-medium">
                      No matching staff records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =====================================================
          ADD / EDIT STAFF MODAL
      ====================================================== */}
      {showModal && (
        <div className="fixed inset-0 bg-[#081529]/55 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-3xl bg-white rounded-3xl border border-white shadow-[0_24px_60px_rgba(8,20,48,0.28)] max-h-[92vh] overflow-y-auto p-6">
            <div className="pb-4 mb-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingStaff ? "Edit Faculty Profile" : "Register New Faculty Member"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set up department credentials and Teacher Portal access password.
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Photo Upload */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-14 h-14 rounded-full bg-white border border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                  {formData.photo ? (
                    <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-700 mb-1">Profile Photo</span>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 font-medium text-xs rounded-lg hover:bg-slate-50 transition shadow-2xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                    placeholder="e.g. Dr. Muhammad Ali"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                    placeholder="teacher@localpro1.net"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-mono placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                    placeholder="03001234567"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation *</label>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                    placeholder="Senior Instructor / Teacher"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                    placeholder="Computer Science"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Salary (PKR)</label>
                  <input
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 tabular-nums placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {editingStaff ? "New Portal Password (Leave blank to keep current)" : "Portal Login Password (Min 6 chars)"}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                  placeholder={editingStaff ? "•••••••• (optional)" : "Enter login password"}
                />
              </div>

              {/* Modal Footer */}
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
                  {saving ? "Saving..." : editingStaff ? "Update Staff" : "Register Faculty"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffManagement;
