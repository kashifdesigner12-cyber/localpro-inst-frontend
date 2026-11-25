import React, { useEffect, useMemo, useState } from "react";
import {
  RotateCw,
  Plus,
  Search,
  Receipt,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Pencil,
  Trash2,
  X,
  Check,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { apiCall } from "../../services/api";

function OfficeExpenses() {
  const today = new Date().toISOString().split("T")[0];

  const emptyForm = {
    category: "Utilities",
    description: "",
    amount: "",
    date: today,
    paymentMethod: "CASH",
    reference: "",
  };

  const [expenses, setExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const [formData, setFormData] = useState(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const categories = [
    "Fee",
    "Salary",
    "Maintenance",
    "Transport",
    "Utilities",
    "Stationery",
    "Donation",
    "Event",
    "Other",
  ];

  const paymentMethods = [
    { value: "CASH", label: "Cash" },
    { value: "BANK", label: "Bank" },
    { value: "ONLINE", label: "Online" },
    { value: "OTHER", label: "Other" },
  ];

  const loadExpenses = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const result = await apiCall("/transactions?type=EXPENSE&limit=100", "GET");
      if (!result.success) {
        setErrorMsg(result.message || "Failed to load office expenses.");
        return;
      }
      const transactionList = result.data?.data?.transactions || [];
      setExpenses(transactionList);
    } catch (error) {
      console.error("Load expenses error:", error);
      setErrorMsg(error.message || "Unable to load office expenses.");
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const result = await apiCall("/transactions/summary", "GET");
      if (!result.success) return;
      const data = result.data?.data || {};
      setSummary({
        totalIncome: Number(data.totalIncome || 0),
        totalExpense: Number(data.totalExpense || 0),
        balance: Number(data.balance || 0),
      });
    } catch (error) {
      console.error("Load summary error:", error);
    }
  };

  useEffect(() => {
    loadExpenses();
    loadSummary();
  }, []);

  const refreshData = async () => {
    setSuccessMsg("");
    await Promise.all([loadExpenses(), loadSummary()]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openAddModal = () => {
    setEditingExpense(null);
    setErrorMsg("");
    setFormData({
      ...emptyForm,
      date: today,
    });
    setShowModal(true);
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setErrorMsg("");
    const dateValue = expense.date
      ? new Date(expense.date).toISOString().split("T")[0]
      : today;

    setFormData({
      category: expense.category || "Other",
      description: expense.description || "",
      amount: expense.amount ?? "",
      date: dateValue,
      paymentMethod: expense.paymentMethod || "CASH",
      reference: expense.reference || "",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingExpense(null);
    setErrorMsg("");
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const description = formData.description.trim();
    const amount = Number(formData.amount);

    if (!description) {
      setErrorMsg("Please enter expense description.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setErrorMsg("Amount must be greater than zero.");
      return;
    }
    if (!formData.category) {
      setErrorMsg("Please select a category.");
      return;
    }

    const payload = {
      type: "EXPENSE",
      category: formData.category,
      description,
      amount,
      date: formData.date || today,
      paymentMethod: formData.paymentMethod || "CASH",
      reference: formData.reference.trim(),
    };

    setSaving(true);

    try {
      let result;
      if (editingExpense?._id) {
        result = await apiCall(`/transactions/${editingExpense._id}`, "PUT", payload);
      } else {
        result = await apiCall("/transactions", "POST", payload);
      }

      if (!result.success) {
        setErrorMsg(result.message || "Failed to save office expense.");
        return;
      }

      setSuccessMsg(
        editingExpense ? "Expense updated successfully." : "Expense added successfully."
      );
      closeModal();
      await refreshData();

      setTimeout(() => {
        setSuccessMsg("");
      }, 4000);
    } catch (error) {
      console.error("Save expense error:", error);
      setErrorMsg(error.message || "Unable to save expense.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (expense) => {
    if (!expense?._id) return;

    const confirmed = window.confirm(`Delete expense "${expense.description}"?`);
    if (!confirmed) return;

    setDeletingId(expense._id);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const result = await apiCall(`/transactions/${expense._id}`, "DELETE");
      if (!result.success) {
        setErrorMsg(result.message || "Failed to delete expense.");
        return;
      }

      setSuccessMsg("Expense deleted successfully.");
      await refreshData();

      setTimeout(() => {
        setSuccessMsg("");
      }, 4000);
    } catch (error) {
      console.error("Delete expense error:", error);
      setErrorMsg(error.message || "Unable to delete expense.");
    } finally {
      setDeletingId("");
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        String(item.description || "").toLowerCase().includes(q) ||
        String(item.reference || "").toLowerCase().includes(q) ||
        String(item.category || "").toLowerCase().includes(q);

      const matchesCategory =
        categoryFilter === "All" ||
        String(item.category || "").toLowerCase() === categoryFilter.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchTerm, categoryFilter]);

  return (
    <div className="space-y-5">
      {/* TOP PAGE HEADER BANNER (3D ELEVATED WHITE CARD) */}
      <div className="bg-white/95 backdrop-blur-xs rounded-3xl border border-white shadow-[0_12px_30px_rgba(15,23,42,0.05)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] text-white shadow-md shadow-blue-500/30 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Office Expenses & Ledger
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Track operational expenses, utility payments, hardware maintenance, and net account balance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={refreshData}
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
            <span>+ Record Expense</span>
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

      {/* 3D FINANCIAL SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-3xl bg-gradient-to-br from-[#059669] to-[#34D399] text-white p-5 shadow-[0_12px_28px_rgba(16,185,129,0.26)] border-t border-white/30 flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/30 text-white flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-emerald-50">Total Revenue</p>
              <h3 className="text-xl xl:text-2xl font-extrabold text-white tracking-tight tabular-nums whitespace-nowrap mt-0.5">
                Rs {summary.totalIncome.toLocaleString()}
              </h3>
            </div>
          </div>
          <p className="text-[11px] font-semibold text-emerald-50 mt-4 pt-3 border-t border-white/20">
            Total income from all streams
          </p>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-[#FEF3C7] via-[#FDE68A]/80 to-[#FCD34D]/60 text-slate-900 p-5 shadow-[0_10px_25px_rgba(245,158,11,0.14)] border border-white flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D97706] to-[#F59E0B] text-white shadow-md shadow-amber-500/30 flex items-center justify-center shrink-0">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700">Total Expenses</p>
              <h3 className="text-xl xl:text-2xl font-extrabold text-rose-600 tracking-tight tabular-nums whitespace-nowrap mt-0.5">
                Rs {summary.totalExpense.toLocaleString()}
              </h3>
            </div>
          </div>
          <p className="text-[11px] font-bold text-amber-900 mt-4 pt-3 border-t border-amber-200/70">
            Operational overheads & utilities
          </p>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] text-white p-5 shadow-[0_12px_28px_rgba(37,99,235,0.28)] border-t border-white/30 flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/30 text-white flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-blue-100">Current Net Balance</p>
              <h3 className="text-xl xl:text-2xl font-extrabold text-white tracking-tight tabular-nums whitespace-nowrap mt-0.5">
                Rs {summary.balance.toLocaleString()}
              </h3>
            </div>
          </div>
          <p className="text-[11px] font-semibold text-blue-100 mt-4 pt-3 border-t border-white/20">
            Remaining liquid operational funds
          </p>
        </div>
      </div>

      {/* FILTER & EXPENSES TABLE CARD */}
      <div className="bg-white/95 rounded-3xl border border-white shadow-[0_14px_34px_rgba(15,23,42,0.05)] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search description, reference..."
              className="w-full bg-[#F1F5F9] border border-slate-200/80 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-semibold">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
            >
              <option value="All">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium text-slate-400">Loading expense vouchers...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4">Reference</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map((expense) => {
                    const formattedDate = expense.date
                      ? new Date(expense.date).toLocaleDateString()
                      : "-";

                    return (
                      <tr key={expense._id} className="hover:bg-[#EFF6FF]/60 transition-colors">
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {formattedDate}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
                            {expense.category || "Expense"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 max-w-sm truncate">
                          {expense.description}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-rose-600 tabular-nums">
                          Rs {Number(expense.amount || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                          {expense.paymentMethod || "CASH"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {expense.reference || "-"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => openEditModal(expense)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#2563EB] font-bold text-xs transition"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense)}
                              disabled={deletingId === expense._id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs transition disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{deletingId === expense._id ? "..." : "Delete"}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-400 font-medium">
                      No expense records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =====================================================
          ADD / EDIT EXPENSE MODAL
      ====================================================== */}
      {showModal && (
        <div className="fixed inset-0 bg-[#081529]/55 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-white shadow-[0_24px_60px_rgba(8,20,48,0.28)] overflow-hidden p-6">
            <div className="pb-4 mb-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingExpense ? "Edit Expense Voucher" : "Record New Office Expense"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record an official outgoing transaction to the institutional expense ledger.
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

            <form onSubmit={handleSaveExpense} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Description *</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Internet Bill for November"
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (PKR) *</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    placeholder="3500"
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 tabular-nums placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                  >
                    {paymentMethods.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Voucher / Invoice Ref</label>
                  <input
                    type="text"
                    name="reference"
                    value={formData.reference}
                    onChange={handleInputChange}
                    placeholder="e.g. INV-9821"
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                  />
                </div>
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
                  {saving ? "Saving..." : editingExpense ? "Update Expense" : "Record Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OfficeExpenses;
