import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Send,
  ArrowLeft,
  Check,
  CheckCheck,
  Camera,
  LogOut,
  UserCog,
  Paperclip,
  X,
  FileText,
  Trash2,
  ChevronDown,
  Upload,
  Award,
  ClipboardList,
  GraduationCap,
} from "lucide-react";
import { useChat } from "../../context/ChatContext";
import { apiCall, API_BASE_URL } from "../../services/api";

const serverOrigin = API_BASE_URL.replace(/\/api\/?$/, "");

const formatTime = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

const getFullFileUrl = (url) => {
  if (!url) return "";
  return url.startsWith("http") ? url : `${serverOrigin}${url}`;
};

const getFileExtension = (filename = "") => {
  const parts = String(filename).toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() : "";
};

function StudentChatApp({ onLogout }) {
  const {
    socketConnected,
    currentUser,
    currentUserId,
    contacts,
    refreshContacts,
    messagesByPartner,
    setActivePartnerId,
    loadMessagesWithPartner,
    sendMessage,
    deleteMessage,
    clearChatWithPartner,
    onlineUserIds,
    typingUsers,
    emitTyping,
    emitStopTyping,
  } = useChat();

  const [studentProfile, setStudentProfile] = useState(currentUser || {});
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState(
    currentUser?.chatDisplayName || currentUser?.name || ""
  );
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [openMenuMsgId, setOpenMenuMsgId] = useState(null);
  const [logoError, setLogoError] = useState(false);

  // Task submission state per task message
  const [activeSubmitTaskId, setActiveSubmitTaskId] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionNote, setSubmissionNote] = useState("");
  const [submittingTask, setSubmittingTask] = useState(false);

  // In-app file viewer modal state
  const [previewFile, setPreviewFile] = useState(null);
  const [previewTextContent, setPreviewTextContent] = useState("");
  const [loadingPreviewText, setLoadingPreviewText] = useState(false);

  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      setStudentProfile(currentUser);
      setDisplayNameInput(currentUser.chatDisplayName || currentUser.name || "");
    }
  }, [currentUser]);

  const filteredContacts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return contacts.filter((c) => {
      const matchesRole =
        roleFilter === "all" ||
        (roleFilter === "teacher" &&
          (c.role === "teacher" || c.role === "admin")) ||
        (roleFilter === "student" && c.role === "student");

      const matchesSearch =
        !q ||
        c.name?.toLowerCase().includes(q) ||
        c.subtitle?.toLowerCase().includes(q);

      return matchesRole && matchesSearch;
    });
  }, [contacts, roleFilter, searchTerm]);

  const currentMessages = useMemo(() => {
    if (!selectedPartner?._id) return [];
    return messagesByPartner[String(selectedPartner._id)] || [];
  }, [messagesByPartner, selectedPartner]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages, typingUsers]);

  const handleOpenFilePreview = async (url, name) => {
    const fullUrl = getFullFileUrl(url);
    const ext = getFileExtension(name || url);
    setPreviewFile({ url: fullUrl, name: name || "Attachment", ext });
    setPreviewTextContent("");

    if (["txt", "csv", "json", "md", "js", "html", "css"].includes(ext)) {
      setLoadingPreviewText(true);
      try {
        const res = await fetch(fullUrl);
        const text = await res.text();
        setPreviewTextContent(text);
      } catch {
        setPreviewTextContent(
          "Unable to load text preview. Please use Download or Open in New Tab."
        );
      } finally {
        setLoadingPreviewText(false);
      }
    }
  };

  const handleSelectContact = (contact) => {
    setSelectedPartner(contact);
    setOpenMenuMsgId(null);
    setActiveSubmitTaskId(null);
    loadMessagesWithPartner(contact._id);
  };

  const handleBackMobile = () => {
    setSelectedPartner(null);
    setActivePartnerId(null);
    setOpenMenuMsgId(null);
  };

  const handleClearCurrentChat = async () => {
    if (!selectedPartner?._id) return;
    const confirmed = window.confirm(
      `Clear all messages with ${selectedPartner.name}?`
    );
    if (!confirmed) return;
    await clearChatWithPartner(selectedPartner._id);
  };

  const handleInputChange = (e) => {
    setMessageText(e.target.value);
    if (!selectedPartner?._id) return;

    emitTyping(selectedPartner._id);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping(selectedPartner._id);
    }, 1500);
  };

  const handleSendText = async (e) => {
    e.preventDefault();
    const trimmed = messageText.trim();
    if (!trimmed || !selectedPartner?._id || sendingMessage) return;

    setSendingMessage(true);
    setMessageText("");
    emitStopTyping(selectedPartner._id);

    try {
      await sendMessage({
        receiver: {
          _id: String(selectedPartner._id),
          role: selectedPartner.role || "teacher",
          name: selectedPartner.name || "User",
        },
        text: trimmed,
        messageType: "text",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPartner?._id) return;

    const formData = new FormData();
    formData.append("attachment", file);
    setUploadingFile(true);

    try {
      const res = await apiCall("/chat/upload", "POST", formData);
      if (res.success && res.data?.data?.attachmentUrl) {
        await sendMessage({
          receiver: {
            _id: String(selectedPartner._id),
            role: selectedPartner.role || "teacher",
            name: selectedPartner.name || "User",
          },
          text: file.name,
          messageType: "file",
          attachmentUrl: res.data.data.attachmentUrl,
          attachmentName: res.data.data.attachmentName || file.name,
        });
      }
    } finally {
      setUploadingFile(false);
      e.target.value = "";
    }
  };

  const handleSubmitTaskSolution = async (e, messageId) => {
    e.preventDefault();
    if ((!submissionFile && !submissionNote.trim()) || submittingTask) return;

    setSubmittingTask(true);
    let submissionFileUrl = "";
    let submissionFileName = "";

    try {
      if (submissionFile) {
        const formData = new FormData();
        formData.append("attachment", submissionFile);
        const uploadRes = await apiCall("/chat/upload", "POST", formData);
        if (uploadRes.success && uploadRes.data?.data?.attachmentUrl) {
          submissionFileUrl = uploadRes.data.data.attachmentUrl;
          submissionFileName =
            uploadRes.data.data.attachmentName || submissionFile.name;
        }
      }

      const res = await apiCall(`/chat/task/${messageId}/submit`, "PATCH", {
        submissionFileUrl,
        submissionFileName,
        submissionNote: submissionNote.trim(),
      });

      if (res.success) {
        setActiveSubmitTaskId(null);
        setSubmissionFile(null);
        setSubmissionNote("");
        if (selectedPartner?._id) {
          loadMessagesWithPartner(selectedPartner._id);
        }
      } else {
        alert(res.message || "Failed to submit task.");
      }
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      let photoUrl = studentProfile.photo;
      if (avatarFile) {
        const formData = new FormData();
        formData.append("attachment", avatarFile);
        const uploadRes = await apiCall("/chat/upload", "POST", formData);
        if (uploadRes.success && uploadRes.data?.data?.attachmentUrl) {
          photoUrl = uploadRes.data.data.attachmentUrl;
        }
      }

      const patchRes = await apiCall("/chat/profile", "PATCH", {
        chatDisplayName: displayNameInput.trim(),
        photo: photoUrl,
      });

      if (patchRes.success) {
        const updated = patchRes.data?.data?.user;
        if (updated) {
          setStudentProfile(updated);
          localStorage.setItem("studentUser", JSON.stringify(updated));
        }
        setShowProfileModal(false);
        refreshContacts();
      } else {
        alert(patchRes.message || "Failed to update profile.");
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const myPhotoUrl = getFullFileUrl(
    avatarPreview || studentProfile?.photo || currentUser?.photo
  );

  return (
    <div
      onClick={() => setOpenMenuMsgId(null)}
      className="h-[100dvh] w-screen bg-[#E8F0FE] flex items-center justify-center overflow-hidden font-sans p-0 sm:p-3 md:p-4"
    >
      <div className="w-full h-full max-w-7xl sm:h-[94dvh] sm:rounded-3xl bg-white shadow-[0_24px_60px_rgba(8,20,48,0.16)] border-0 sm:border sm:border-white flex overflow-hidden">
        {/* LEFT ROSTER PANEL (Full-screen on mobile when no chat selected) */}
        <div
          className={`${
            selectedPartner ? "hidden md:flex" : "flex"
          } w-full md:w-[340px] lg:w-[380px] flex-col border-r border-slate-200/80 bg-white h-full`}
        >
          {/* Mobile Brand Strip */}
          <div className="md:hidden bg-white px-4 py-2.5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              {!logoError ? (
                <img
                  src="/institute-logo.png"
                  alt="LOCALPRO1"
                  onError={() => setLogoError(true)}
                  className="h-7 w-auto object-contain"
                />
              ) : (
                <span className="text-sm font-extrabold text-[#0C234B]">
                  LOCALPRO1
                </span>
              )}
              <span className="text-[11px] font-bold text-[#2563EB] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/70">
                Student Portal
              </span>
            </div>
            <span
              className={`text-[10px] font-semibold flex items-center gap-1 ${
                socketConnected ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  socketConnected ? "bg-[#22C55E]" : "bg-amber-400"
                }`}
              />
              {socketConnected ? "Connected" : "Connecting..."}
            </span>
          </div>

          {/* Student Profile Header */}
          <div className="bg-gradient-to-r from-[#0C234B] via-[#102E63] to-[#1D4ED8] text-white px-4 py-3.5 flex items-center justify-between shrink-0 shadow-sm">
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-3 text-left min-w-0 group"
              title="Edit Profile"
            >
              <div className="relative w-10 h-10 rounded-full bg-white/15 overflow-hidden flex items-center justify-center font-bold text-xs shrink-0 border border-white/25">
                {myPhotoUrl ? (
                  <img
                    src={myPhotoUrl}
                    alt={studentProfile?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (studentProfile?.name || "S").charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm sm:text-xs font-extrabold truncate group-hover:underline">
                    {studentProfile?.chatDisplayName ||
                      studentProfile?.name ||
                      "Student"}
                  </p>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      socketConnected ? "bg-[#22C55E]" : "bg-amber-400"
                    }`}
                  />
                </div>
                <p className="text-[11px] sm:text-[10px] text-blue-200/85 truncate font-mono">
                  {studentProfile?.admissionNo || "Online"}
                </p>
              </div>
            </button>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                title="Profile Settings"
                className="p-2 rounded-xl hover:bg-white/15 text-blue-100 hover:text-white transition"
              >
                <UserCog className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onLogout}
                title="Sign Out"
                className="p-2 rounded-xl hover:bg-rose-500/30 text-rose-200 hover:text-white transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search & Role Filters */}
          <div className="p-3 bg-slate-50/80 border-b border-slate-200/80 space-y-2.5 shrink-0">
            <div className="flex items-center gap-2 bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 sm:py-2 focus-within:bg-white focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-blue-500/15 transition">
              <Search className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search teachers or peers..."
                className="w-full text-sm sm:text-xs outline-none text-slate-800 placeholder:text-slate-400 bg-transparent"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {[
                { key: "all", label: "All" },
                { key: "teacher", label: "Faculty" },
                { key: "student", label: "Students" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setRoleFilter(tab.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-[11px] transition shrink-0 ${
                    roleFilter === tab.key
                      ? "bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white font-bold shadow-xs"
                      : "bg-white border border-slate-200/80 text-slate-600 font-semibold hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredContacts.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 font-medium">
                No conversations found.
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isSelected =
                  String(selectedPartner?._id) === String(contact._id);
                const isOnline = onlineUserIds.includes(String(contact._id));
                const isTyping = typingUsers[String(contact._id)];

                return (
                  <button
                    key={contact._id}
                    type="button"
                    onClick={() => handleSelectContact(contact)}
                    className={`w-full px-4 py-3.5 sm:py-3 flex items-center gap-3 transition text-left active:bg-blue-50/70 ${
                      isSelected
                        ? "bg-[#EFF6FF] border-l-4 border-[#2563EB]"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center overflow-hidden border border-slate-200">
                        {contact.photo ? (
                          <img
                            src={getFullFileUrl(contact.photo)}
                            alt={contact.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          contact.name?.charAt(0)?.toUpperCase() || "U"
                        )}
                      </div>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#22C55E] ring-2 ring-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-sm sm:text-xs font-bold text-slate-900 truncate">
                            {contact.name}
                          </p>
                          {(contact.role === "admin" ||
                            contact.role === "teacher") && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-[#2563EB] border border-blue-200 shrink-0">
                              {contact.role === "admin" ? "Admin" : "Faculty"}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {formatTime(contact.lastMessageTime)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-xs sm:text-[11px] text-slate-500 truncate">
                          {isTyping ? (
                            <span className="text-[#2563EB] font-semibold">
                              typing...
                            </span>
                          ) : (
                            contact.lastMessage || contact.subtitle
                          )}
                        </p>

                        {contact.unreadCount > 0 && (
                          <span className="min-w-[20px] h-[20px] sm:min-w-[18px] sm:h-[18px] px-1 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-xs">
                            {contact.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT ACTIVE CHAT PANEL (Full-screen on mobile when chat selected) */}
        <div
          className={`${
            selectedPartner ? "flex" : "hidden md:flex"
          } flex-1 flex-col h-full bg-[#EFF4FB] overflow-hidden`}
        >
          {selectedPartner ? (
            <>
              {/* Active Header */}
              <div className="bg-white border-b border-slate-200/80 px-3 sm:px-4 py-2.5 flex items-center justify-between shrink-0 shadow-2xs">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={handleBackMobile}
                    aria-label="Back to contacts"
                    className="md:hidden p-2 -ml-1 rounded-xl text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition shrink-0"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-slate-100 text-slate-700 overflow-hidden flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                    {selectedPartner.photo ? (
                      <img
                        src={getFullFileUrl(selectedPartner.photo)}
                        alt={selectedPartner.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      selectedPartner.name?.charAt(0)?.toUpperCase() || "U"
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-xs font-bold text-slate-900 truncate">
                      {selectedPartner.name}
                    </p>
                    <p className="text-[11px] sm:text-[10px] text-[#2563EB] font-semibold truncate flex items-center gap-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          onlineUserIds.includes(String(selectedPartner._id))
                            ? "bg-[#22C55E]"
                            : "bg-slate-300"
                        }`}
                      />
                      {typingUsers[String(selectedPartner._id)]
                        ? "typing..."
                        : onlineUserIds.includes(String(selectedPartner._id))
                        ? "online"
                        : selectedPartner.subtitle}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearCurrentChat}
                  title="Clear Chat History"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
                >
                  <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
                {currentMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <span className="bg-white border border-slate-200/80 text-slate-500 text-xs font-medium px-4 py-2 rounded-full shadow-2xs">
                      Send a message to start conversation
                    </span>
                  </div>
                ) : (
                  currentMessages.map((msg) => {
                    const isMine = String(msg.senderId) === currentUserId;
                    const canDeleteForEveryone =
                      !msg.isDeletedForEveryone && isMine;
                    const taskFileRawUrl =
                      msg.task?.attachmentUrl || msg.attachmentUrl;
                    const taskFileUrl = getFullFileUrl(taskFileRawUrl);
                    const taskFileName =
                      msg.task?.attachmentName ||
                      msg.attachmentName ||
                      "Task File";

                    const hasStudentSubmission = Boolean(
                      msg.task?.submissionFileUrl || msg.task?.submissionNote
                    );

                    return (
                      <div
                        key={msg._id}
                        className={`flex ${
                          isMine ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`group relative max-w-[88%] sm:max-w-[78%] md:max-w-[70%] px-3.5 py-2.5 text-xs ${
                            isMine
                              ? "bg-gradient-to-br from-[#DBEAFE] to-[#BFDBFE]/80 text-slate-900 border border-blue-200/70 rounded-2xl rounded-tr-none shadow-2xs"
                              : "bg-white text-slate-800 border border-slate-200/80 rounded-2xl rounded-tl-none shadow-2xs"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuMsgId((prev) =>
                                prev === msg._id ? null : msg._id
                              );
                            }}
                            title="Options"
                            className="opacity-75 sm:opacity-0 sm:group-hover:opacity-100 absolute top-1.5 right-1.5 p-1 rounded text-slate-400 hover:text-slate-700 transition"
                          >
                            <ChevronDown className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                          </button>

                          {openMenuMsgId === msg._id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className={`absolute top-7 ${
                                isMine ? "right-1" : "left-1"
                              } z-30 w-44 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-1.5 text-[11px] font-semibold`}
                            >
                              {canDeleteForEveryone && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    deleteMessage(
                                      selectedPartner._id,
                                      msg._id,
                                      "everyone"
                                    );
                                    setOpenMenuMsgId(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-1.5"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete for Everyone</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  deleteMessage(
                                    selectedPartner._id,
                                    msg._id,
                                    "me"
                                  );
                                  setOpenMenuMsgId(null);
                                }}
                                className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete for Me</span>
                              </button>
                            </div>
                          )}

                          {msg.isDeletedForEveryone ? (
                            <p className="italic text-slate-400 pr-5">
                              🚫 This message was deleted
                            </p>
                          ) : msg.messageType === "task" && msg.task ? (
                            <div className="bg-white border border-amber-200/90 rounded-2xl p-3 sm:p-3.5 my-1 space-y-2.5 shadow-2xs">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                                  <ClipboardList className="w-3.5 h-3.5" />{" "}
                                  Assignment Task
                                </span>
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                                    msg.task.status === "Completed"
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                      : "bg-amber-100 text-amber-800 border border-amber-300"
                                  }`}
                                >
                                  {msg.task.status || "Pending"}
                                </span>
                              </div>

                              <p className="font-extrabold text-slate-900 text-xs">
                                {msg.task.title}
                              </p>
                              {msg.task.description && (
                                <p className="text-[11px] text-slate-600 whitespace-pre-wrap">
                                  {msg.task.description}
                                </p>
                              )}

                              {taskFileUrl && (
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <span className="text-[11px] text-slate-700 font-semibold truncate">
                                    {taskFileName}
                                  </span>
                                  <div className="flex gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleOpenFilePreview(
                                          taskFileRawUrl,
                                          taskFileName
                                        )
                                      }
                                      className="flex-1 sm:flex-none px-2.5 py-1.5 sm:py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-[10px] font-bold transition"
                                    >
                                      View
                                    </button>
                                    <a
                                      href={taskFileUrl}
                                      download={taskFileName}
                                      className="flex-1 sm:flex-none text-center px-2.5 py-1.5 sm:py-1 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white rounded-lg text-[10px] font-bold shadow-xs transition"
                                    >
                                      Download
                                    </a>
                                  </div>
                                </div>
                              )}

                              {msg.task.dueDate && (
                                <p className="text-[10px] font-semibold text-rose-600">
                                  Due: {msg.task.dueDate}
                                </p>
                              )}

                              {/* Student Submission Display */}
                              {hasStudentSubmission && (
                                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/90 space-y-1.5">
                                  <p className="text-[10px] font-extrabold uppercase text-emerald-900">
                                    Your Submitted Work
                                  </p>
                                  {msg.task.submissionNote && (
                                    <p className="text-[11px] text-slate-700 whitespace-pre-wrap">
                                      {msg.task.submissionNote}
                                    </p>
                                  )}
                                  {msg.task.submissionFileUrl && (
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                                      <span className="text-[11px] font-mono text-slate-700 truncate">
                                        {msg.task.submissionFileName ||
                                          "Solution File"}
                                      </span>
                                      <div className="flex gap-1.5 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleOpenFilePreview(
                                              msg.task.submissionFileUrl,
                                              msg.task.submissionFileName ||
                                                "Solution"
                                            )
                                          }
                                          className="flex-1 sm:flex-none px-2.5 py-1.5 sm:py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition"
                                        >
                                          View
                                        </button>
                                        <a
                                          href={getFullFileUrl(
                                            msg.task.submissionFileUrl
                                          )}
                                          download={
                                            msg.task.submissionFileName ||
                                            "solution"
                                          }
                                          className="flex-1 sm:flex-none text-center px-2.5 py-1.5 sm:py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold transition"
                                        >
                                          Download
                                        </a>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Teacher Grading & Score Banner */}
                              {(msg.task.marks || msg.task.feedback) && (
                                <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200/90 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-extrabold uppercase text-indigo-900 flex items-center gap-1">
                                      <Award className="w-3.5 h-3.5 text-indigo-700" />
                                      <span>Graded by Instructor</span>
                                    </span>
                                    {msg.task.marks && (
                                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                                        Score: {msg.task.marks}
                                      </span>
                                    )}
                                  </div>
                                  {msg.task.feedback && (
                                    <p className="text-[11px] text-slate-700 italic">
                                      “{msg.task.feedback}”
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Student Submit Task Form */}
                              {activeSubmitTaskId === msg._id ? (
                                <form
                                  onSubmit={(e) =>
                                    handleSubmitTaskSolution(e, msg._id)
                                  }
                                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
                                >
                                  <p className="text-[10px] font-extrabold text-slate-800">
                                    Submit Your Solution
                                  </p>
                                  <textarea
                                    rows="2"
                                    value={submissionNote}
                                    onChange={(e) =>
                                      setSubmissionNote(e.target.value)
                                    }
                                    placeholder="Add solution notes, links, or descriptions..."
                                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none resize-none focus:border-[#2563EB]"
                                  />
                                  <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-xl p-2 text-[11px]">
                                    <label className="flex items-center gap-1.5 text-slate-700 font-semibold cursor-pointer truncate">
                                      <Upload className="w-3.5 h-3.5 shrink-0" />
                                      <span className="truncate">
                                        {submissionFile
                                          ? submissionFile.name
                                          : "Attach Solution File"}
                                      </span>
                                      <input
                                        type="file"
                                        onChange={(e) =>
                                          setSubmissionFile(
                                            e.target.files?.[0] || null
                                          )
                                        }
                                        className="hidden"
                                      />
                                    </label>
                                    {submissionFile && (
                                      <button
                                        type="button"
                                        onClick={() => setSubmissionFile(null)}
                                        className="text-rose-600 font-bold px-1.5"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>

                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setActiveSubmitTaskId(null)
                                      }
                                      className="px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="submit"
                                      disabled={submittingTask}
                                      className="flex-1 py-2 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white rounded-xl text-xs font-bold shadow-sm transition"
                                    >
                                      {submittingTask
                                        ? "Uploading..."
                                        : "Submit Assignment"}
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setActiveSubmitTaskId(msg._id)}
                                  className="w-full py-2.5 px-3 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>
                                    {hasStudentSubmission
                                      ? "Re-submit Solution"
                                      : "Submit Assignment"}
                                  </span>
                                </button>
                              )}
                            </div>
                          ) : msg.messageType === "file" &&
                            msg.attachmentUrl ? (
                            <div className="bg-white/90 border border-slate-200/80 rounded-2xl p-3 my-1">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 truncate">
                                <FileText className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                                <span className="truncate">
                                  {msg.attachmentName || "Attachment"}
                                </span>
                              </div>
                              <div className="flex gap-1.5 mt-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenFilePreview(
                                      msg.attachmentUrl,
                                      msg.attachmentName || "Attachment"
                                    )
                                  }
                                  className="flex-1 py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[11px] font-bold transition"
                                >
                                  Open
                                </button>
                                <a
                                  href={getFullFileUrl(msg.attachmentUrl)}
                                  download={msg.attachmentName || "file"}
                                  className="flex-1 py-1.5 px-2.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white rounded-xl text-[11px] font-bold text-center shadow-sm transition"
                                >
                                  Download
                                </a>
                              </div>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap break-words leading-relaxed pr-4 text-[13px] sm:text-xs">
                              {msg.text}
                            </p>
                          )}

                          <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400">
                            <span>{formatTime(msg.createdAt)}</span>
                            {isMine &&
                              !msg.isDeletedForEveryone &&
                              (msg.status === "seen" ? (
                                <CheckCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-slate-400" />
                              ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar (Mobile-friendly sticky bottom) */}
              <form
                onSubmit={handleSendText}
                className="bg-white border-t border-slate-200/80 px-3 sm:px-3.5 py-2.5 sm:py-3 flex items-center gap-2 shrink-0"
              >
                <label
                  title="Attach File"
                  className="p-2.5 sm:p-2 rounded-xl text-slate-500 hover:text-[#2563EB] hover:bg-blue-50 cursor-pointer transition shrink-0"
                >
                  <Paperclip className="w-5 h-5 sm:w-4 sm:h-4" />
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                    className="hidden"
                  />
                </label>

                <input
                  type="text"
                  value={messageText}
                  onChange={handleInputChange}
                  placeholder="Type your message..."
                  className="flex-1 bg-[#F8FAFC] rounded-xl px-4 py-2.5 sm:py-2 text-sm sm:text-xs text-slate-800 placeholder:text-slate-400 outline-none border border-slate-200 focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-blue-500/15 transition"
                />

                <button
                  type="submit"
                  disabled={!messageText.trim() || sendingMessage}
                  className="w-10 h-10 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] disabled:opacity-40 text-white flex items-center justify-center transition shrink-0 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            /* DESKTOP EMPTY STATE — SEAMLESSLY MERGED LOGO & LARGER TYPOGRAPHY */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-[#EFF4FB] select-none">
              <div className="mb-6 flex items-center justify-center">
                {!logoError ? (
                  <img
                    src="/institute-logo.png"
                    alt="LOCALPRO1 Institute Logo"
                    onError={() => setLogoError(true)}
                    className="h-24 lg:h-28 w-auto object-contain mix-blend-multiply drop-shadow-xs"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#1D4ED8] to-[#38BDF8] text-white flex items-center justify-center shadow-lg">
                    <GraduationCap className="w-10 h-10" />
                  </div>
                )}
              </div>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                LocalPro1 Student Portal
              </h2>
              <p className="text-sm lg:text-base text-slate-600 max-w-md mt-2.5 leading-relaxed">
                Connect directly with your course instructors, submit class
                assignments, and track evaluation feedback in real-time.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* STUDENT PROFILE SETTINGS MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-[#081529]/55 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-white shadow-[0_24px_60px_rgba(8,20,48,0.28)] w-full max-w-md p-5 sm:p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-extrabold text-slate-900">
                Chat Profile Settings
              </h3>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-sm shrink-0">
                  {myPhotoUrl ? (
                    <img
                      src={myPhotoUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (studentProfile?.name || "S").charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-700 mb-1">
                    Update Display Picture
                  </span>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition shadow-2xs">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Choose Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  required
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm sm:text-xs font-medium text-slate-800 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 outline-none transition"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  disabled={savingProfile}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  {savingProfile ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FILE PREVIEW MODAL */}
      {previewFile && (
        <div className="fixed inset-0 bg-[#081529]/60 backdrop-blur-xs z-[70] flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-3xl max-h-[92dvh] flex flex-col overflow-hidden shadow-[0_24px_60px_rgba(8,20,48,0.3)] border border-white">
            <div className="bg-gradient-to-r from-[#0C234B] via-[#102E63] to-[#1D4ED8] text-white px-4 sm:px-5 py-3 flex items-center justify-between gap-2 shrink-0 shadow-sm">
              <p className="text-xs sm:text-sm font-bold truncate">
                {previewFile.name}
              </p>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <a
                  href={previewFile.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[11px] sm:text-xs font-semibold transition"
                >
                  Open
                </a>
                <a
                  href={previewFile.url}
                  download={previewFile.name}
                  className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white text-[11px] sm:text-xs font-bold shadow-sm transition"
                >
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="p-1.5 rounded-xl hover:bg-white/15 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-[#EFF4FB] p-3 sm:p-4 flex items-center justify-center min-h-[260px]">
              {["jpg", "jpeg", "png", "webp", "gif"].includes(
                previewFile.ext
              ) ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="max-w-full max-h-[72dvh] rounded-xl object-contain shadow-xs"
                />
              ) : previewFile.ext === "pdf" ? (
                <iframe
                  src={previewFile.url}
                  title={previewFile.name}
                  className="w-full h-[72dvh] rounded-xl border border-slate-300 bg-white"
                />
              ) : ["txt", "csv", "json", "md", "js", "html", "css"].includes(
                  previewFile.ext
                ) ? (
                <div className="w-full h-[65dvh] bg-white rounded-xl border border-slate-200 p-4 overflow-auto">
                  {loadingPreviewText ? (
                    <p className="text-xs text-slate-400">Loading text...</p>
                  ) : (
                    <pre className="text-xs text-slate-800 whitespace-pre-wrap font-mono">
                      {previewTextContent}
                    </pre>
                  )}
                </div>
              ) : (
                <div className="text-center p-6 sm:p-8 bg-white rounded-xl border border-slate-200 max-w-sm">
                  <FileText className="w-10 h-10 text-[#2563EB] mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-900">
                    {previewFile.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Download document to view locally.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentChatApp;