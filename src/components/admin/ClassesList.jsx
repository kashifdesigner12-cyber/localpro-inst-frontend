import React, { useEffect, useState } from "react";
import {
  RotateCw,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  AlertCircle,
  School,
  Users,
  Layers,
} from "lucide-react";
import { apiCall } from "../../services/api";

function ClassesList() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  const [className, setClassName] = useState("");
  const [sections, setSections] = useState([]);
  const [newSection, setNewSection] = useState("");

  const [deleteModal, setDeleteModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadClasses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiCall("/classes", "GET");
      if (!response.success) {
        throw new Error(response.message || "Failed to load classes");
      }

      const backendData = response.data;
      let classList = [];
      if (Array.isArray(backendData?.data)) {
        classList = backendData.data;
      } else if (Array.isArray(backendData)) {
        classList = backendData;
      } else if (Array.isArray(backendData?.classes)) {
        classList = backendData.classes;
      }

      setClasses(classList);
    } catch (err) {
      console.error("Load classes error:", err);
      setError(
        err.message ||
          "Unable to load classes. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const openAddModal = () => {
    clearMessages();
    setEditingClass(null);
    setClassName("");
    setSections([]);
    setNewSection("");
    setShowClassModal(true);
  };

  const openEditModal = (classItem) => {
    clearMessages();
    setEditingClass(classItem);
    setClassName(classItem.name || "");
    setSections(Array.isArray(classItem.sections) ? [...classItem.sections] : []);
    setNewSection("");
    setShowClassModal(true);
  };

  const closeClassModal = () => {
    if (saving) return;
    setShowClassModal(false);
    setEditingClass(null);
    setClassName("");
    setSections([]);
    setNewSection("");
  };

  const addSectionToForm = () => {
    const section = newSection.trim();
    if (!section) return;

    const alreadyExists = sections.some(
      (item) => item.toLowerCase() === section.toLowerCase()
    );
    if (alreadyExists) {
      setError("This section already exists.");
      return;
    }

    setSections((prev) => [...prev, section]);
    setNewSection("");
    setError("");
  };

  const removeSectionFromForm = (sectionToRemove) => {
    setSections((prev) => prev.filter((section) => section !== sectionToRemove));
  };

  const handleSectionKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addSectionToForm();
    }
  };

  const handleSaveClass = async (event) => {
    event.preventDefault();
    clearMessages();

    const trimmedName = className.trim();
    if (!trimmedName) {
      setError("Please enter a class name.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: trimmedName,
        sections: sections,
      };

      let response;
      if (editingClass) {
        const id = editingClass._id || editingClass.id;
        response = await apiCall(`/classes/${id}`, "PUT", payload);
      } else {
        response = await apiCall("/classes", "POST", payload);
      }

      if (!response.success) {
        throw new Error(
          response.message ||
            `Failed to ${editingClass ? "update" : "create"} class`
        );
      }

      setSuccess(
        editingClass ? "Class updated successfully." : "Class added successfully."
      );
      closeClassModal();
      await loadClasses();

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Save class error:", err);
      setError(
        err.message || "Something went wrong while saving the class."
      );
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (classItem) => {
    clearMessages();
    setClassToDelete(classItem);
    setDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteModal(false);
    setClassToDelete(null);
  };

  const handleDeleteClass = async () => {
    if (!classToDelete) return;
    const id = classToDelete._id || classToDelete.id;
    if (!id) {
      setError("Invalid class ID.");
      return;
    }

    try {
      setDeleting(true);
      clearMessages();

      const response = await apiCall(`/classes/${id}`, "DELETE");
      if (!response.success) {
        throw new Error(response.message || "Failed to delete class");
      }

      setSuccess("Class deleted successfully.");
      closeDeleteModal();
      await loadClasses();

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Delete class error:", err);
      setError(err.message || "Something went wrong while deleting class.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* TOP PAGE HEADER BANNER (3D ELEVATED WHITE CARD) */}
      <div className="bg-white/95 backdrop-blur-xs rounded-3xl border border-white shadow-[0_12px_30px_rgba(15,23,42,0.05)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] text-white shadow-md shadow-blue-500/30 flex items-center justify-center shrink-0">
            <School className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Class & Course Batch Management
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#2563EB] border border-blue-200/70">
                {classes.length} Total
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Organize academic classes, batches, and assign specific morning/evening sections.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={loadClasses}
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
            <span>+ Add Class</span>
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-medium flex items-center gap-2.5">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-medium flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* CLASSES GRID */}
      {loading ? (
        <div className="text-center py-16 bg-white/95 rounded-3xl border border-white shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
          <div className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium text-slate-400">Loading classes...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.length > 0 ? (
            classes.map((cls) => {
              const clsSections = Array.isArray(cls.sections) ? cls.sections : [];

              return (
                <div
                  key={cls._id || cls.id}
                  className="bg-white/95 backdrop-blur-xs rounded-3xl border border-white shadow-[0_14px_34px_rgba(15,23,42,0.05)] hover:shadow-[0_18px_40px_rgba(37,99,235,0.10)] p-6 flex flex-col justify-between transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#DBEAFE] to-[#BFDBFE]/80 text-[#2563EB] flex items-center justify-center shrink-0 shadow-2xs">
                          <School className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                            {cls.name}
                          </h3>
                          <span className="text-[11px] font-medium text-slate-500">
                            {clsSections.length} Section{clsSections.length === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(cls)}
                          className="p-2 rounded-xl bg-blue-50 text-[#2563EB] hover:bg-blue-100 transition"
                          title="Edit Class"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(cls)}
                          className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                          title="Delete Class"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Section Badges */}
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                        Assigned Sections
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {clsSections.length > 0 ? (
                          clsSections.map((sec, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-[#F8FAFC] text-slate-700 border border-slate-200/80"
                            >
                              {sec}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No sections created</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-16 bg-white/95 rounded-3xl border border-white shadow-[0_14px_34px_rgba(15,23,42,0.05)] text-slate-400 text-xs font-medium">
              No classes created yet. Click "+ Add Class" to get started.
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          ADD / EDIT CLASS MODAL
      ====================================================== */}
      {showClassModal && (
        <div className="fixed inset-0 bg-[#081529]/55 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-white shadow-[0_24px_60px_rgba(8,20,48,0.28)] overflow-hidden p-6">
            <div className="pb-4 mb-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingClass ? "Edit Class" : "Create New Class"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure the class title and its assigned student sections.
                </p>
              </div>
              <button
                type="button"
                onClick={closeClassModal}
                disabled={saving}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Class / Course Title *</label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  required
                  placeholder="e.g. Full Stack Development"
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Add Sections (Press Enter)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSection}
                    onChange={(e) => setNewSection(e.target.value)}
                    onKeyDown={handleSectionKeyDown}
                    placeholder="e.g. Morning A"
                    className="flex-1 bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={addSectionToForm}
                    className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-[#2563EB] text-xs font-bold rounded-xl transition"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Sections list */}
              {sections.length > 0 && (
                <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-slate-200/80">
                  <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Sections to be assigned:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {sections.map((sec, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-white text-slate-800 border border-slate-200 shadow-2xs"
                      >
                        <span>{sec}</span>
                        <button
                          type="button"
                          onClick={() => removeSectionFromForm(sec)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeClassModal}
                  disabled={saving}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-[0_6px_18px_rgba(37,99,235,0.35)] border-t border-white/25 transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingClass ? "Update Class" : "Create Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          DELETE CLASS MODAL
      ====================================================== */}
      {deleteModal && classToDelete && (
        <div className="fixed inset-0 bg-[#081529]/55 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white rounded-3xl border border-white shadow-[0_24px_60px_rgba(8,20,48,0.28)] p-6">
            <h3 className="text-base font-extrabold text-slate-900">Confirm Deletion</h3>
            <p className="text-xs text-slate-600 mt-2">
              Are you sure you want to delete class <strong className="text-slate-900">{classToDelete.name}</strong>? This action cannot be reversed.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteClass}
                disabled={deleting}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Class"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClassesList;
