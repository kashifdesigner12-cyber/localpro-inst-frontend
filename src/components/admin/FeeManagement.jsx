import React, { useEffect, useMemo, useState } from "react";
import {
  RotateCw,
  Plus,
  Search,
  Receipt,
  CreditCard,
  X,
  Check,
  AlertCircle,
  DollarSign,
  Pencil,
  Trash2,
} from "lucide-react";
import { apiCall } from "../../services/api";

function FeeManagement() {
  const [feeList, setFeeList] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFee, setEditingFee] = useState(null);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const getDefaultMonth = () => {
    const date = new Date();
    return date.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const generateReceiptNumber = () => {
    return `REC-${Math.floor(100000000 + Math.random() * 900000000)}`;
  };

  const [formData, setFormData] = useState({
    studentId: "",
    feeType: "MONTHLY",
    month: getDefaultMonth(),
    receiptNumber: generateReceiptNumber(),
    amount: "",
    discount: "0",
    paidAmount: "",
    paymentDate: today,
    paymentMethod: "CASH",
    notes: "",
  });

  const [editFormData, setEditFormData] = useState({
    feeType: "MONTHLY",
    month: "",
    amount: "",
    discount: "0",
    paidAmount: "",
    paymentDate: today,
    paymentMethod: "CASH",
    notes: "",
  });

  const loadStudents = async () => {
    try {
      const result = await apiCall("/students?limit=100", "GET");
      if (!result.success) {
        setErrorMsg(result.message || "Failed to load students.");
        return;
      }
      const studentList = result.data?.data?.students || [];
      setStudents(studentList);
    } catch (error) {
      console.error("Load students error:", error);
      setErrorMsg(error.message || "Unable to load students.");
    }
  };

  const loadFees = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const result = await apiCall("/fees?limit=100", "GET");
      if (!result.success) {
        setErrorMsg(result.message || "Failed to load fee records.");
        return;
      }
      const fees = result.data?.data?.fees || [];
      setFeeList(fees);
    } catch (error) {
      console.error("Load fees error:", error);
      setErrorMsg(error.message || "Unable to load fee records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadPageData = async () => {
      await Promise.all([loadStudents(), loadFees()]);
    };
    loadPageData();
  }, []);

  const openAddModal = () => {
    setErrorMsg("");
    setFormData({
      studentId: "",
      feeType: "MONTHLY",
      month: getDefaultMonth(),
      receiptNumber: generateReceiptNumber(),
      amount: "",
      discount: "0",
      paidAmount: "",
      paymentDate: today,
      paymentMethod: "CASH",
      notes: "",
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowAddModal(false);
    setErrorMsg("");
  };

  const openEditModal = (fee) => {
    setErrorMsg("");
    const formattedDate = fee.date
      ? new Date(fee.date).toISOString().split("T")[0]
      : today;

    setEditFormData({
      feeType: fee.feeType || "MONTHLY",
      month: fee.month || "",
      amount: String(fee.amount ?? ""),
      discount: String(fee.discount ?? "0"),
      paidAmount: String(fee.paidAmount ?? ""),
      paymentDate: formattedDate,
      paymentMethod: fee.paymentMethod || "CASH",
      notes: fee.notes || "",
    });
    setEditingFee(fee);
  };

  const closeEditModal = () => {
    if (saving) return;
    setEditingFee(null);
    setErrorMsg("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!formData.studentId) {
      setErrorMsg("Please select a student.");
      return;
    }
    if (!formData.month.trim()) {
      setErrorMsg("Please enter fee month.");
      return;
    }
    if (formData.amount === "" || Number(formData.amount) < 0) {
      setErrorMsg("Please enter a valid fee amount.");
      return;
    }

    const amount = Number(formData.amount) || 0;
    const discount = Number(formData.discount) || 0;
    const paidAmount = Number(formData.paidAmount) || 0;

    if (discount > amount) {
      setErrorMsg("Discount cannot exceed total fee amount.");
      return;
    }

    const payable = Math.max(0, amount - discount);
    if (paidAmount > payable) {
      setErrorMsg(
        `Paid amount cannot exceed net payable amount Rs ${payable.toLocaleString()}.`
      );
      return;
    }

    const feePayload = {
      studentId: formData.studentId,
      feeType: formData.feeType,
      month: formData.month.trim(),
      receiptNumber: formData.receiptNumber.trim(),
      amount: amount,
      discount: discount,
      paidAmount: paidAmount,
      paymentMethod: formData.paymentMethod,
      date: formData.paymentDate || undefined,
      notes: formData.notes.trim(),
    };

    setSaving(true);

    try {
      const result = await apiCall("/fees", "POST", feePayload);
      if (!result.success) {
        setErrorMsg(result.message || "Failed to add fee payment.");
        return;
      }

      setSuccessMsg("Fee payment transaction logged successfully!");
      setShowAddModal(false);
      setFormData({
        studentId: "",
        feeType: "MONTHLY",
        month: getDefaultMonth(),
        receiptNumber: generateReceiptNumber(),
        amount: "",
        discount: "0",
        paidAmount: "",
        paymentDate: today,
        paymentMethod: "CASH",
        notes: "",
      });

      await loadFees();
      setTimeout(() => {
        setSuccessMsg("");
      }, 4000);
    } catch (error) {
      console.error("Add fee error:", error);
      setErrorMsg(error.message || "Unable to connect to backend.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    if (!editingFee?._id) return;

    setErrorMsg("");
    setSuccessMsg("");

    if (!editFormData.month.trim()) {
      setErrorMsg("Please enter fee month.");
      return;
    }
    if (editFormData.amount === "" || Number(editFormData.amount) < 0) {
      setErrorMsg("Please enter a valid fee amount.");
      return;
    }

    const amount = Number(editFormData.amount) || 0;
    const discount = Number(editFormData.discount) || 0;
    const paidAmount = Number(editFormData.paidAmount) || 0;

    if (discount > amount) {
      setErrorMsg("Discount cannot exceed total fee amount.");
      return;
    }

    const payable = Math.max(0, amount - discount);
    if (paidAmount > payable) {
      setErrorMsg(
        `Paid amount cannot exceed net payable amount Rs ${payable.toLocaleString()}.`
      );
      return;
    }

    const updatePayload = {
      feeType: editFormData.feeType,
      month: editFormData.month.trim(),
      amount,
      discount,
      paidAmount,
      paymentMethod: editFormData.paymentMethod,
      date: editFormData.paymentDate || undefined,
      notes: editFormData.notes.trim(),
    };

    setSaving(true);

    try {
      const result = await apiCall(
        `/fees/${editingFee._id}`,
        "PUT",
        updatePayload
      );

      if (!result.success) {
        setErrorMsg(result.message || "Failed to update fee record.");
        return;
      }

      setSuccessMsg(
        `Receipt ${editingFee.receiptNumber} updated successfully!`
      );
      setEditingFee(null);
      await loadFees();

      setTimeout(() => {
        setSuccessMsg("");
      }, 4000);
    } catch (error) {
      console.error("Update fee error:", error);
      setErrorMsg(error.message || "Unable to update fee record.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFee = async (fee) => {
    if (!fee?._id) return;

    const studentName = fee.student?.name || "this student";
    const confirmed = window.confirm(
      `Delete fee receipt "${fee.receiptNumber}" for ${studentName}?`
    );
    if (!confirmed) return;

    setErrorMsg("");
    setSuccessMsg("");
    setDeletingId(fee._id);

    try {
      const result = await apiCall(`/fees/${fee._id}`, "DELETE");

      if (!result.success) {
        setErrorMsg(result.message || "Failed to delete fee record.");
        return;
      }

      setFeeList((prev) => prev.filter((item) => item._id !== fee._id));
      setSuccessMsg(`Receipt ${fee.receiptNumber} deleted successfully!`);

      setTimeout(() => {
        setSuccessMsg("");
      }, 4000);
    } catch (error) {
      console.error("Delete fee error:", error);
      setErrorMsg(error.message || "Unable to delete fee record.");
    } finally {
      setDeletingId("");
    }
  };

  const selectedStudent = useMemo(() => {
    return students.find(
      (student) => String(student._id) === String(formData.studentId)
    );
  }, [students, formData.studentId]);

  const totalFeesSum = feeList.reduce(
    (acc, fee) => acc + (Number(fee.amount) || 0),
    0
  );
  const totalCollectedSum = feeList.reduce(
    (acc, fee) => acc + (Number(fee.paidAmount) || 0),
    0
  );
  const totalDiscountSum = feeList.reduce(
    (acc, fee) => acc + (Number(fee.discount) || 0),
    0
  );
  const totalPendingSum = feeList.reduce(
    (acc, fee) => acc + (Number(fee.remainingAmount) || 0),
    0
  );

  const filteredFees = feeList.filter((fee) => {
    const student = fee.student || {};
    const studentName = student.name || "";
    const admissionNo = student.admissionNo || "";
    const receiptNumber = fee.receiptNumber || "";
    const search = searchTerm.trim().toLowerCase();

    const matchesSearch =
      !search ||
      studentName.toLowerCase().includes(search) ||
      admissionNo.toLowerCase().includes(search) ||
      receiptNumber.toLowerCase().includes(search);

    const feeStatus = String(fee.status || "").toUpperCase();
    const matchesFilter =
      statusFilter === "All" ||
      (statusFilter === "Paid" && feeStatus === "PAID") ||
      (statusFilter === "Partial" && feeStatus === "PARTIAL") ||
      (statusFilter === "Pending" &&
        (feeStatus === "PENDING" || feeStatus === "OVERDUE"));

    return matchesSearch && matchesFilter;
  });

  // Live preview calculation inside Edit Modal
  const editPayablePreview = Math.max(
    0,
    (Number(editFormData.amount) || 0) - (Number(editFormData.discount) || 0)
  );
  const editRemainingPreview = Math.max(
    0,
    editPayablePreview - (Number(editFormData.paidAmount) || 0)
  );

  return (
    <div className="space-y-5">
      {/* TOP PAGE HEADER BANNER (3D ELEVATED WHITE CARD) */}
      <div className="bg-white/95 backdrop-blur-xs rounded-3xl border border-white shadow-[0_12px_30px_rgba(15,23,42,0.05)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] text-white shadow-md shadow-blue-500/30 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Fee & Revenue Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Student fee collection ledgers, automated receipts, and recovery tracking.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={loadFees}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl shadow-2xs transition active:scale-95 disabled:opacity-50"
          >
            <RotateCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-[0_6px_18px_rgba(37,99,235,0.35)] border-t border-white/25 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Collect Fee</span>
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

      {errorMsg && !showAddModal && !editingFee && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-medium flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 3D KPI METRIC CARDS (4-Column Pastel/Gradient System) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="rounded-3xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] text-white p-5 shadow-[0_12px_28px_rgba(37,99,235,0.28)] border-t border-white/30 flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/30 text-white flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-blue-100">Total Invoiced</p>
              <h3 className="text-xl xl:text-2xl font-extrabold text-white tracking-tight tabular-nums whitespace-nowrap mt-0.5">
                Rs {totalFeesSum.toLocaleString()}
              </h3>
            </div>
          </div>
          <p className="text-[11px] font-semibold text-blue-100 mt-4 pt-3 border-t border-white/20">
            Total tuition fees billed
          </p>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-[#059669] to-[#34D399] text-white p-5 shadow-[0_12px_28px_rgba(16,185,129,0.26)] border-t border-white/30 flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/30 text-white flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-emerald-50">
                Total Collected
              </p>
              <h3 className="text-xl xl:text-2xl font-extrabold text-white tracking-tight tabular-nums whitespace-nowrap mt-0.5">
                Rs {totalCollectedSum.toLocaleString()}
              </h3>
            </div>
          </div>
          <p className="text-[11px] font-semibold text-emerald-50 mt-4 pt-3 border-t border-white/20">
            Paid & deposited in bank/cash
          </p>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-[#EDE9FE] via-[#E0E7FF] to-[#DDD6FE] text-slate-900 p-5 shadow-[0_10px_25px_rgba(99,102,241,0.12)] border border-white flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#6366F1] text-white shadow-md shadow-indigo-500/30 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-600">
                Outstanding Pending
              </p>
              <h3 className="text-xl xl:text-2xl font-extrabold text-rose-600 tracking-tight tabular-nums whitespace-nowrap mt-0.5">
                Rs {totalPendingSum.toLocaleString()}
              </h3>
            </div>
          </div>
          <p className="text-[11px] font-semibold text-indigo-900 mt-4 pt-3 border-t border-indigo-200/70">
            Unpaid student fee balance
          </p>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-[#FEF3C7] via-[#FDE68A]/80 to-[#FCD34D]/60 text-slate-900 p-5 shadow-[0_10px_25px_rgba(245,158,11,0.14)] border border-white flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D97706] to-[#F59E0B] text-white shadow-md shadow-amber-500/30 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700">
                Total Discounts
              </p>
              <h3 className="text-xl xl:text-2xl font-extrabold text-slate-900 tracking-tight tabular-nums whitespace-nowrap mt-0.5">
                Rs {totalDiscountSum.toLocaleString()}
              </h3>
            </div>
          </div>
          <p className="text-[11px] font-bold text-amber-900 mt-4 pt-3 border-t border-amber-200/70">
            Concessions & scholarships
          </p>
        </div>
      </div>

      {/* FILTER & FEE TRANSACTIONS TABLE CARD */}
      <div className="bg-white/95 rounded-3xl border border-white shadow-[0_14px_34px_rgba(15,23,42,0.05)] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search student, adm# or receipt..."
              className="w-full bg-[#F1F5F9] border border-slate-200/80 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {["All", "Paid", "Partial", "Pending"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  statusFilter === status
                    ? "bg-[#2563EB] text-white shadow-sm shadow-blue-500/25"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium text-slate-400">
              Loading fee records...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Receipt #</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Month</th>
                  <th className="py-3.5 px-4">Billed Amount</th>
                  <th className="py-3.5 px-4">Discount</th>
                  <th className="py-3.5 px-4">Paid Amount</th>
                  <th className="py-3.5 px-4">Remaining</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFees.length > 0 ? (
                  filteredFees.map((fee) => {
                    const student = fee.student || {};
                    const status = String(fee.status || "PENDING").toUpperCase();

                    return (
                      <tr
                        key={fee._id}
                        className="hover:bg-[#EFF6FF]/60 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                          {fee.receiptNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            {student.name || "N/A"}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {student.admissionNo || "-"}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-semibold whitespace-nowrap">
                          {fee.month}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800 tabular-nums whitespace-nowrap">
                          Rs {Number(fee.amount || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-amber-600 tabular-nums font-semibold whitespace-nowrap">
                          Rs {Number(fee.discount || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-emerald-600 tabular-nums whitespace-nowrap">
                          Rs {Number(fee.paidAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-rose-600 tabular-nums whitespace-nowrap">
                          Rs {Number(fee.remainingAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold border ${
                              status === "PAID"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                                : status === "PARTIAL"
                                ? "bg-amber-50 text-amber-700 border-amber-200/80"
                                : "bg-rose-50 text-rose-700 border-rose-200/80"
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                          {fee.paymentMethod || "CASH"}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(fee)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#2563EB] font-bold text-xs transition"
                              title="Edit Fee Payment"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteFee(fee)}
                              disabled={deletingId === fee._id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs transition disabled:opacity-50"
                              title="Delete Fee Receipt"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>
                                {deletingId === fee._id ? "..." : "Delete"}
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
                      colSpan="10"
                      className="text-center py-12 text-slate-400 font-medium"
                    >
                      No matching fee records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =====================================================
          ADD FEE PAYMENT MODAL
      ====================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#081529]/55 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl bg-white rounded-3xl border border-white shadow-[0_24px_60px_rgba(8,20,48,0.28)] max-h-[92vh] overflow-y-auto p-6">
            <div className="pb-4 mb-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Record Student Fee Payment
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generate official fee receipt and record paid amount into ledger.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPayment} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Student Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Student *
                </label>
                <select
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                >
                  <option value="">-- Choose student from directory --</option>
                  {students.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.name} ({student.admissionNo}) - {student.className}
                    </option>
                  ))}
                </select>
              </div>

              {selectedStudent && (
                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200/70 text-xs text-slate-600 space-y-1">
                  <p>
                    Enrolled Course:{" "}
                    <strong className="text-slate-900">
                      {selectedStudent.className}
                    </strong>
                  </p>
                  <p>
                    Guardian:{" "}
                    <strong className="text-slate-900">
                      {selectedStudent.parentName}
                    </strong>{" "}
                    ({selectedStudent.parentPhone || selectedStudent.parentWhatsApp})
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fee Month *
                  </label>
                  <input
                    type="text"
                    name="month"
                    value={formData.month}
                    onChange={handleChange}
                    required
                    placeholder="e.g. November 2026"
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Receipt Number
                  </label>
                  <input
                    type="text"
                    name="receiptNumber"
                    value={formData.receiptNumber}
                    onChange={handleChange}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-mono outline-none"
                    readOnly
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fee Amount (PKR) *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    placeholder="5000"
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 tabular-nums placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Discount (PKR)
                  </label>
                  <input
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 tabular-nums placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Paid Amount (PKR) *
                  </label>
                  <input
                    type="number"
                    name="paidAmount"
                    value={formData.paidAmount}
                    onChange={handleChange}
                    required
                    placeholder="5000"
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 tabular-nums placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank Deposit</option>
                    <option value="ONLINE">
                      Online Transfer / EasyPaisa / JazzCash
                    </option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    name="paymentDate"
                    value={formData.paymentDate}
                    onChange={handleChange}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes / Ledger Reference
                </label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Optional transaction reference..."
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-[0_6px_18px_rgba(37,99,235,0.35)] border-t border-white/25 transition disabled:opacity-50"
                >
                  {saving ? "Processing..." : "Generate Receipt & Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          EDIT FEE PAYMENT MODAL
      ====================================================== */}
      {editingFee && (
        <div className="fixed inset-0 bg-[#081529]/55 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl bg-white rounded-3xl border border-white shadow-[0_24px_60px_rgba(8,20,48,0.28)] max-h-[92vh] overflow-y-auto p-6">
            <div className="pb-4 mb-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Edit Fee Payment —{" "}
                  <span className="font-mono text-[#2563EB]">
                    {editingFee.receiptNumber}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Student:{" "}
                  <strong className="text-slate-800">
                    {editingFee.student?.name || "N/A"}
                  </strong>{" "}
                  ({editingFee.student?.admissionNo || "-"})
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePayment} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fee Month *
                  </label>
                  <input
                    type="text"
                    name="month"
                    value={editFormData.month}
                    onChange={handleEditChange}
                    required
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Receipt Number
                  </label>
                  <input
                    type="text"
                    value={editingFee.receiptNumber}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-mono outline-none"
                    readOnly
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Billed Amount (PKR) *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={editFormData.amount}
                    onChange={handleEditChange}
                    required
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 tabular-nums focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Discount (PKR)
                  </label>
                  <input
                    type="number"
                    name="discount"
                    value={editFormData.discount}
                    onChange={handleEditChange}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 tabular-nums focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Paid Amount (PKR) *
                  </label>
                  <input
                    type="number"
                    name="paidAmount"
                    value={editFormData.paidAmount}
                    onChange={handleEditChange}
                    required
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 tabular-nums focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                  />
                </div>
              </div>

              {/* Live Updated Balance Summary */}
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-600 font-semibold">
                  Net Payable:{" "}
                  <strong className="text-slate-900 tabular-nums">
                    Rs {editPayablePreview.toLocaleString()}
                  </strong>
                </span>
                <span className="text-slate-600 font-semibold">
                  New Remaining Balance:{" "}
                  <strong
                    className={`tabular-nums ${
                      editRemainingPreview === 0
                        ? "text-emerald-700"
                        : "text-rose-600"
                    }`}
                  >
                    Rs {editRemainingPreview.toLocaleString()}
                  </strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    name="paymentMethod"
                    value={editFormData.paymentMethod}
                    onChange={handleEditChange}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank Deposit</option>
                    <option value="ONLINE">
                      Online Transfer / EasyPaisa / JazzCash
                    </option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    name="paymentDate"
                    value={editFormData.paymentDate}
                    onChange={handleEditChange}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes / Ledger Reference
                </label>
                <input
                  type="text"
                  name="notes"
                  value={editFormData.notes}
                  onChange={handleEditChange}
                  placeholder="Optional transaction reference..."
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-[0_6px_18px_rgba(37,99,235,0.35)] border-t border-white/25 transition disabled:opacity-50"
                >
                  {saving ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeeManagement;