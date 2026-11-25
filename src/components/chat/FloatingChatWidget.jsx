import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MessageCircle,
  X,
  Send,
  Search,
  ClipboardList,
  Check,
  CheckCheck,
  ArrowLeft,
  Eye,
  Users,
  Paperclip,
  FileText,
  Trash2,
  ChevronDown,
  Maximize2,
  Minimize2,
  Award,
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

function FloatingChatWidget({ role = "teacher" }) {
  const {
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
    totalUnreadCount,
    adminConversations,
    refreshAdminConversations,
    adminRoomMessages,
    loadAdminRoomMessages,
    deleteAdminMonitorRoom,
  } = useChat();

  const [isOpen, setIsOpen] = useState(false);
  const [isFullPage, setIsFullPage] = useState(false);
  const [activeTab, setActiveTab] = useState("chats");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [selectedMonitorRoom, setSelectedMonitorRoom] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskFile, setTaskFile] = useState(null);
  const [sendingTask, setSendingTask] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [openMenuMsgId, setOpenMenuMsgId] = useState(null);

  // Teacher / Admin Grading state per task message
  const [gradingTaskId, setGradingTaskId] = useState(null);
  const [gradeMarks, setGradeMarks] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [savingGrade, setSavingGrade] = useState(false);

  // In-app file preview modal state
  const [previewFile, setPreviewFile] = useState(null);
  const [previewTextContent, setPreviewTextContent] = useState("");
  const [loadingPreviewText, setLoadingPreviewText] = useState(false);

  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  const filteredContacts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return contacts.filter((c) => {
      if (!q) return true;
      return (
        c.name?.toLowerCase().includes(q) ||
        c.subtitle?.toLowerCase().includes(q) ||
        c.admissionNo?.toLowerCase().includes(q)
      );
    });
  }, [contacts, searchTerm]);

  const currentMessages = useMemo(() => {
    if (!selectedPartner?._id) return [];
    return messagesByPartner[String(selectedPartner._id)] || [];
  }, [messagesByPartner, selectedPartner]);

  const currentMonitorMessages = useMemo(() => {
    if (!selectedMonitorRoom?._id) return [];
    return adminRoomMessages[selectedMonitorRoom._id] || [];
  }, [adminRoomMessages, selectedMonitorRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages, currentMonitorMessages, typingUsers]);

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

  const handleOpenDrawer = () => {
    setIsOpen(true);
    refreshContacts();
    if (role === "admin") {
      refreshAdminConversations();
    }
  };

  const handleSelectContact = (contact) => {
    setSelectedPartner(contact);
    setSelectedMonitorRoom(null);
    setShowTaskForm(false);
    setOpenMenuMsgId(null);
    setGradingTaskId(null);
    loadMessagesWithPartner(contact._id);
  };

  const handleBackToList = () => {
    setSelectedPartner(null);
    setSelectedMonitorRoom(null);
    setActivePartnerId(null);
    setShowTaskForm(false);
    setOpenMenuMsgId(null);
    setGradingTaskId(null);
  };

  const handleClearCurrentChat = async () => {
    if (!selectedPartner?._id) return;
    const confirmed = window.confirm(
      `Delete all messages with ${selectedPartner.name}?`
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
          role: selectedPartner.role || "student",
          name: selectedPartner.name || "User",
        },
        text: trimmed,
        messageType: "text",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSendTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !selectedPartner?._id || sendingTask) return;

    setSendingTask(true);
    let attachmentUrl = "";
    let attachmentName = "";

    try {
      if (taskFile) {
        const formData = new FormData();
        formData.append("attachment", taskFile);
        const uploadRes = await apiCall("/chat/upload", "POST", formData);
        if (uploadRes.success && uploadRes.data?.data?.attachmentUrl) {
          attachmentUrl = uploadRes.data.data.attachmentUrl;
          attachmentName = uploadRes.data.data.attachmentName || taskFile.name;
        }
      }

      await sendMessage({
        receiver: {
          _id: String(selectedPartner._id),
          role: selectedPartner.role || "student",
          name: selectedPartner.name || "User",
        },
        text: taskTitle.trim(),
        messageType: "task",
        attachmentUrl,
        attachmentName,
        task: {
          title: taskTitle.trim(),
          description: taskDesc.trim(),
          dueDate: taskDueDate,
          attachmentUrl,
          attachmentName,
          status: "Pending",
        },
      });

      setTaskTitle("");
      setTaskDesc("");
      setTaskDueDate("");
      setTaskFile(null);
      setShowTaskForm(false);
    } finally {
      setSendingTask(false);
    }
  };

  const handleSaveGrade = async (e, messageId) => {
    e.preventDefault();
    if ((!gradeMarks.trim() && !gradeFeedback.trim()) || savingGrade) return;

    setSavingGrade(true);
    try {
      const res = await apiCall(`/chat/task/${messageId}/grade`, "PATCH", {
        marks: gradeMarks.trim(),
        feedback: gradeFeedback.trim(),
      });
      if (res.success) {
        setGradingTaskId(null);
        setGradeMarks("");
        setGradeFeedback("");
        if (selectedPartner?._id) {
          loadMessagesWithPartner(selectedPartner._id);
        }
      } else {
        alert(res.message || "Failed to save grade");
      }
    } finally {
      setSavingGrade(false);
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
            role: selectedPartner.role || "student",
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

  const handleOpenMonitorRoom = (conv) => {
    setSelectedPartner(null);
    setSelectedMonitorRoom(conv);
    loadAdminRoomMessages(conv._id);
  };

  const handleDeleteMonitoredRoom = async (e, roomId) => {
    e.stopPropagation();
    if (!window.confirm("Permanently delete this monitored conversation?")) return;
    await deleteAdminMonitorRoom(roomId);
    if (selectedMonitorRoom?._id === roomId) {
      setSelectedMonitorRoom(null);
    }
  };

  // Shared Left Sidebar Content
  const renderSidebarPanel = () => (
    <div className="flex-1 flex flex-col bg-white overflow-hidden h-full">
      {role === "admin" && (
        <div className="bg-gradient-to-r from-[#0C234B] via-[#102E63] to-[#1D4ED8] px-3 py-2.5 flex gap-2 shrink-0 border-b border-white/10 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("chats")}
            className={`flex-1 py-1.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition ${
              activeTab === "chats"
                ? "bg-white text-[#0C234B] font-extrabold shadow-xs"
                : "bg-white/15 text-blue-100 hover:bg-white/25 font-semibold"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Students ({contacts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("monitor");
              refreshAdminConversations();
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition ${
              activeTab === "monitor"
                ? "bg-white text-[#0C234B] font-extrabold shadow-xs"
                : "bg-white/15 text-blue-100 hover:bg-white/25 font-semibold"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Supervision ({adminConversations.length})</span>
          </button>
        </div>
      )}

      {activeTab === "chats" ? (
        <>
          <div className="p-3 bg-slate-50/80 border-b border-slate-200/80 shrink-0">
            <div className="flex items-center gap-2 bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2 focus-within:bg-white focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-blue-500/15 transition">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search students..."
                className="w-full text-xs outline-none text-slate-800 placeholder:text-slate-400 bg-transparent"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredContacts.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 font-medium">
                No active contacts found.
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isOnline = onlineUserIds.includes(String(contact._id));
                const isTyping = typingUsers[String(contact._id)];
                const isSelected = String(selectedPartner?._id) === String(contact._id);

                return (
                  <button
                    key={contact._id}
                    type="button"
                    onClick={() => handleSelectContact(contact)}
                    className={`w-full px-4 py-3 flex items-center gap-3 transition text-left ${
                      isSelected ? "bg-[#EFF6FF] border-l-4 border-[#2563EB]" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center overflow-hidden border border-slate-200">
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
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {contact.name}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {formatTime(contact.lastMessageTime)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-[11px] text-slate-500 truncate">
                          {isTyping ? (
                            <span className="text-[#2563EB] font-semibold">typing...</span>
                          ) : (
                            contact.lastMessage || contact.subtitle
                          )}
                        </p>

                        {contact.unreadCount > 0 && (
                          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-xs">
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
        </>
      ) : (
        <div className="flex-1 overflow-y-auto bg-white divide-y divide-slate-100">
          {adminConversations.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 font-medium">
              No conversations recorded yet.
            </div>
          ) : (
            adminConversations.map((conv) => {
              const last = conv.lastMessage || {};
              const isSelected = selectedMonitorRoom?._id === conv._id;
              return (
                <div
                  key={conv._id}
                  onClick={() => handleOpenMonitorRoom(conv)}
                  className={`w-full px-4 py-3 flex items-center justify-between gap-3 transition text-left cursor-pointer ${
                    isSelected ? "bg-[#EFF6FF] border-l-4 border-[#2563EB]" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {last.senderName} ({last.senderRole}) ↔ {last.receiverName} ({last.receiverRole})
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {last.messageType === "task"
                        ? `📋 Task: ${last.task?.title || last.text}`
                        : last.text || last.attachmentName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {formatTime(last.createdAt)}
                      </span>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                        {conv.totalMessages} msgs
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteMonitoredRoom(e, conv._id)}
                      title="Delete Conversation"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );

  // Shared Active Chat / Monitor / Empty Logo Panel
  const renderConversationPanel = () => {
    if (selectedPartner) {
      return (
        <div className="flex-1 flex flex-col bg-[#EFF4FB] h-full overflow-hidden">
          {/* Top Chat Header */}
          <div className="bg-white border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 overflow-hidden flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                {selectedPartner.photo ? (
                  <img
                    src={getFullFileUrl(selectedPartner.photo)}
                    alt={selectedPartner.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  selectedPartner.name?.charAt(0)?.toUpperCase() || "S"
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {selectedPartner.name}
                </p>
                <p className="text-[10px] text-[#2563EB] font-semibold truncate flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${onlineUserIds.includes(String(selectedPartner._id)) ? "bg-[#22C55E]" : "bg-slate-300"}`} />
                  {typingUsers[String(selectedPartner._id)]
                    ? "typing..."
                    : onlineUserIds.includes(String(selectedPartner._id))
                    ? "online"
                    : selectedPartner.subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {selectedPartner.role === "student" && (
                <button
                  type="button"
                  onClick={() => setShowTaskForm((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
                    showTaskForm
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : "bg-blue-50 hover:bg-blue-100 text-[#2563EB] border border-blue-200/60"
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>Task</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleClearCurrentChat}
                title="Delete Chat History"
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Task Assignment Form Drawer */}
          {showTaskForm && (
            <form
              onSubmit={handleSendTask}
              className="bg-amber-50/95 border-b border-amber-200 p-4 space-y-2.5 shrink-0"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-amber-700" />
                  Assign Academic Task to {selectedPartner.name}
                </p>
                <button
                  type="button"
                  onClick={() => setShowTaskForm(false)}
                  className="text-amber-800 hover:text-amber-950 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                required
                placeholder="Task title (e.g. Build Responsive Landing Page)"
                className="w-full px-3.5 py-2 text-xs bg-white border border-amber-200 rounded-xl outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15"
              />
              <textarea
                rows="2"
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                placeholder="Task instructions, requirements, deliverables..."
                className="w-full px-3.5 py-2 text-xs bg-white border border-amber-200 rounded-xl outline-none resize-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15"
              />

              <div className="flex items-center justify-between gap-2 bg-white border border-amber-200 rounded-xl px-3 py-2">
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-900 cursor-pointer truncate">
                  <Paperclip className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {taskFile ? taskFile.name : "Attach assignment file (optional)"}
                  </span>
                  <input
                    type="file"
                    onChange={(e) => setTaskFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
                {taskFile && (
                  <button
                    type="button"
                    onClick={() => setTaskFile(null)}
                    className="text-rose-600 text-xs font-bold px-1"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="px-3 py-2 text-xs bg-white border border-amber-200 rounded-xl outline-none"
                />
                <button
                  type="submit"
                  disabled={sendingTask}
                  className="flex-1 py-2 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  {sendingTask ? "Sending Task..." : "Assign Task"}
                </button>
              </div>
            </form>
          )}

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {currentMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <span className="bg-white border border-slate-200/80 text-slate-500 text-xs font-medium px-4 py-2 rounded-full shadow-2xs">
                  Say Assalam-o-Alaikum to {selectedPartner.name}
                </span>
              </div>
            ) : (
              currentMessages.map((msg) => {
                const isMine = String(msg.senderId) === currentUserId;
                const canDeleteForEveryone = !msg.isDeletedForEveryone && (isMine || role === "admin");
                const taskFileRawUrl = msg.task?.attachmentUrl || msg.attachmentUrl;
                const taskFileUrl = getFullFileUrl(taskFileRawUrl);
                const taskFileName = msg.task?.attachmentName || msg.attachmentName || "Task Attachment";
                const hasStudentSubmission = Boolean(msg.task?.submissionFileUrl || msg.task?.submissionNote);

                return (
                  <div key={msg._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`group relative ${
                        isFullPage ? "max-w-[68%]" : "max-w-[85%]"
                      } px-3.5 py-2.5 text-xs ${
                        isMine
                          ? "bg-gradient-to-br from-[#DBEAFE] to-[#BFDBFE]/80 text-slate-900 border border-blue-200/70 rounded-2xl rounded-tr-none shadow-2xs"
                          : "bg-white text-slate-800 border border-slate-200/80 rounded-2xl rounded-tl-none shadow-2xs"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuMsgId((prev) => (prev === msg._id ? null : msg._id));
                        }}
                        title="Options"
                        className="opacity-0 group-hover:opacity-100 absolute top-1.5 right-1.5 p-0.5 rounded text-slate-400 hover:text-slate-700 transition"
                      >
                        <ChevronDown className="w-3 h-3" />
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
                                deleteMessage(selectedPartner._id, msg._id, "everyone");
                                setOpenMenuMsgId(null);
                              }}
                              className="w-full px-3.5 py-1.5 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete for Everyone</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              deleteMessage(selectedPartner._id, msg._id, "me");
                              setOpenMenuMsgId(null);
                            }}
                            className="w-full px-3.5 py-1.5 text-left text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete for Me</span>
                          </button>
                        </div>
                      )}

                      {msg.isDeletedForEveryone ? (
                        <p className="italic text-slate-400 pr-4">🚫 This message was deleted</p>
                      ) : msg.messageType === "task" && msg.task ? (
                        <div className="bg-white border border-amber-200/90 rounded-2xl p-3.5 my-1 space-y-2.5 shadow-2xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                              <ClipboardList className="w-3.5 h-3.5" /> Assigned Task
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

                          <p className="font-extrabold text-slate-900 text-xs">{msg.task.title}</p>
                          {msg.task.description && (
                            <p className="text-[11px] text-slate-600 whitespace-pre-wrap">{msg.task.description}</p>
                          )}

                          {taskFileUrl && (
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
                              <span className="text-[11px] text-slate-700 font-semibold truncate">{taskFileName}</span>
                              <div className="flex gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenFilePreview(taskFileRawUrl, taskFileName)}
                                  className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-[10px] font-bold transition"
                                >
                                  View
                                </button>
                                <a
                                  href={taskFileUrl}
                                  download={taskFileName}
                                  className="px-2.5 py-1 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white rounded-lg text-[10px] font-bold shadow-xs transition"
                                >
                                  Download
                                </a>
                              </div>
                            </div>
                          )}

                          {msg.task.dueDate && (
                            <p className="text-[10px] font-semibold text-rose-600">Due Date: {msg.task.dueDate}</p>
                          )}

                          {/* Student Submission */}
                          {hasStudentSubmission && (
                            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/90 space-y-1.5">
                              <p className="text-[10px] font-extrabold uppercase text-emerald-900">Student Submission</p>
                              {msg.task.submissionNote && (
                                <p className="text-[11px] text-slate-700 whitespace-pre-wrap">{msg.task.submissionNote}</p>
                              )}
                              {msg.task.submissionFileUrl && (
                                <div className="flex items-center justify-between gap-2 pt-1">
                                  <span className="text-[11px] font-mono text-slate-700 truncate">
                                    {msg.task.submissionFileName || "Solution File"}
                                  </span>
                                  <div className="flex gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenFilePreview(msg.task.submissionFileUrl, msg.task.submissionFileName || "Solution")}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition"
                                    >
                                      View
                                    </button>
                                    <a
                                      href={getFullFileUrl(msg.task.submissionFileUrl)}
                                      download={msg.task.submissionFileName || "solution"}
                                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold transition"
                                    >
                                      Download
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Evaluation & Marks Display */}
                          {(msg.task.marks || msg.task.feedback) && (
                            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200/90 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-extrabold uppercase text-indigo-900 flex items-center gap-1">
                                  <Award className="w-3.5 h-3.5" /> Teacher Evaluation
                                </span>
                                {msg.task.marks && (
                                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                                    {msg.task.marks}
                                  </span>
                                )}
                              </div>
                              {msg.task.feedback && (
                                <p className="text-[11px] text-slate-700 italic">"{msg.task.feedback}"</p>
                              )}
                            </div>
                          )}

                          {/* Grading Input Form */}
                          {gradingTaskId === msg._id ? (
                            <form onSubmit={(e) => handleSaveGrade(e, msg._id)} className="p-3 bg-slate-50 border border-indigo-200 rounded-xl space-y-2">
                              <p className="text-[10px] font-extrabold text-indigo-900">Grading & Score Entry</p>
                              <input
                                type="text"
                                value={gradeMarks}
                                onChange={(e) => setGradeMarks(e.target.value)}
                                placeholder="Marks (e.g. 9/10 or 90%)"
                                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-[#2563EB]"
                              />
                              <textarea
                                rows="2"
                                value={gradeFeedback}
                                onChange={(e) => setGradeFeedback(e.target.value)}
                                placeholder="Feedback for student..."
                                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl outline-none resize-none focus:border-[#2563EB]"
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setGradingTaskId(null)}
                                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  disabled={savingGrade}
                                  className="flex-1 py-1.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white rounded-xl text-xs font-bold shadow-sm transition"
                                >
                                  {savingGrade ? "Saving..." : "Save Evaluation"}
                                </button>
                              </div>
                            </form>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setGradingTaskId(msg._id);
                                setGradeMarks(msg.task.marks || "");
                                setGradeFeedback(msg.task.feedback || "");
                              }}
                              className="w-full py-2 px-3 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition"
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>{msg.task.marks || msg.task.feedback ? "Edit Grade" : "Grade Submission"}</span>
                            </button>
                          )}
                        </div>
                      ) : msg.messageType === "file" && msg.attachmentUrl ? (
                        <div className="bg-white/90 border border-slate-200/80 rounded-2xl p-3 my-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 truncate">
                            <FileText className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                            <span className="truncate">{msg.attachmentName || "Attachment"}</span>
                          </div>
                          <div className="flex gap-1.5 mt-2">
                            <button
                              type="button"
                              onClick={() => handleOpenFilePreview(msg.attachmentUrl, msg.attachmentName || "Attachment")}
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
                        <p className="whitespace-pre-wrap break-words leading-relaxed pr-3">{msg.text}</p>
                      )}

                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400">
                        <span>{formatTime(msg.createdAt)}</span>
                        {isMine && !msg.isDeletedForEveryone && (
                          msg.status === "seen" ? (
                            <CheckCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-slate-400" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input Bar */}
          <form onSubmit={handleSendText} className="bg-white border-t border-slate-200/80 px-3.5 py-3 flex items-center gap-2 shrink-0">
            <label title="Attach Document" className="p-2 rounded-xl text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 cursor-pointer transition">
              <Paperclip className="w-4 h-4" />
              <input type="file" onChange={handleFileUpload} disabled={uploadingFile} className="hidden" />
            </label>

            <input
              type="text"
              value={messageText}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="flex-1 bg-[#F8FAFC] rounded-xl px-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none border border-slate-200 focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-blue-500/15 transition"
            />

            <button
              type="submit"
              disabled={!messageText.trim() || sendingMessage}
              className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] disabled:opacity-40 text-white flex items-center justify-center transition shrink-0 shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      );
    }

    if (selectedMonitorRoom) {
      return (
        <div className="flex-1 flex flex-col bg-[#EFF4FB] h-full overflow-hidden">
          <div className="bg-white border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between shrink-0">
            <p className="text-xs font-bold text-slate-900">
              Supervision: {selectedMonitorRoom.lastMessage?.senderName} ↔ {selectedMonitorRoom.lastMessage?.receiverName}
            </p>
            <button
              type="button"
              onClick={(e) => handleDeleteMonitoredRoom(e, selectedMonitorRoom._id)}
              className="px-3 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100 transition"
            >
              Delete Room
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {currentMonitorMessages.map((msg) => (
              <div key={msg._id} className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs text-xs">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#0C234B] mb-1">
                  <span>{msg.senderName} ({msg.senderRole}) → {msg.receiverName}</span>
                  <span className="text-slate-400 font-normal">{formatTime(msg.createdAt)}</span>
                </div>
                <p className="text-slate-700 whitespace-pre-wrap">
                  {msg.isDeletedForEveryone
                    ? "🚫 This message was deleted"
                    : msg.messageType === "task"
                    ? `📋 Task: ${msg.task?.title || msg.text}`
                    : msg.text || msg.attachmentName}
                </p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#EFF4FB] select-none">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#3B82F6] text-white flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30 border border-white/20">
          <MessageCircle className="w-7 h-7" />
        </div>
        <h2 className="text-base font-extrabold text-slate-900">
          Institute Messaging Portal
        </h2>
        <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
          Select any student or colleague from the left roster to begin direct communication, assign practical tasks, or review student work.
        </p>
      </div>
    );
  };

  return (
    <>
      {/* FLOATING ACTION TRIGGER */}
      {!isOpen && (
        <button
          type="button"
          onClick={handleOpenDrawer}
          title="Open Messaging"
          className="fixed bottom-6 right-6 z-50 h-13 px-5 rounded-full bg-gradient-to-tr from-[#1D4ED8] via-[#2563EB] to-[#38BDF8] hover:scale-105 text-white shadow-[0_12px_30px_rgba(37,99,235,0.45)] border-t border-white/30 flex items-center gap-2.5 transition active:scale-95"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-xs font-bold hidden sm:inline">Messages</span>
          {totalUnreadCount > 0 && (
            <span className="min-w-[20px] h-[20px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
              {totalUnreadCount}
            </span>
          )}
        </button>
      )}

      {/* CHAT POPUP / DRAWER */}
      {isOpen && (
        <div
          onClick={() => setOpenMenuMsgId(null)}
          className={
            isFullPage
              ? "fixed inset-0 z-50 bg-[#081529]/55 backdrop-blur-xs flex items-center justify-center p-0 md:p-6"
              : "fixed bottom-5 right-5 z-50 w-[95vw] sm:w-[420px] h-[620px] max-h-[88vh]"
          }
        >
          <div
            className={
              isFullPage
                ? "w-full h-full max-w-7xl md:rounded-3xl bg-white shadow-[0_24px_60px_rgba(8,20,48,0.28)] border border-white flex flex-col overflow-hidden"
                : "w-full h-full bg-white rounded-3xl shadow-[0_24px_60px_rgba(8,20,48,0.28)] border border-white flex flex-col overflow-hidden"
            }
          >
            {/* TOP HEADER */}
            <div className="bg-gradient-to-r from-[#0C234B] via-[#102E63] to-[#1D4ED8] text-white px-4 py-3.5 flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                {!isFullPage && (selectedPartner || selectedMonitorRoom) && (
                  <button
                    type="button"
                    onClick={handleBackToList}
                    className="p-1.5 rounded-xl hover:bg-white/15 transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}

                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E] ring-2 ring-white/25 animate-pulse shrink-0" />
                  <span className="text-xs font-extrabold tracking-tight truncate">
                    {selectedPartner ? selectedPartner.name : "LocalPro1 Institute Chat"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsFullPage((prev) => !prev)}
                  title={isFullPage ? "Collapse" : "Expand"}
                  className="p-1.5 rounded-xl hover:bg-white/15 text-blue-100 hover:text-white transition"
                >
                  {isFullPage ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsFullPage(false);
                  }}
                  title="Close"
                  className="p-1.5 rounded-xl hover:bg-white/15 text-blue-100 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CONTENT AREA */}
            {isFullPage ? (
              <div className="flex-1 flex overflow-hidden">
                <div className="w-full md:w-[360px] lg:w-[380px] border-r border-slate-200 flex flex-col h-full">
                  {renderSidebarPanel()}
                </div>
                <div className="hidden md:flex flex-1 flex-col h-full">
                  {renderConversationPanel()}
                </div>
              </div>
            ) : !selectedPartner && !selectedMonitorRoom ? (
              renderSidebarPanel()
            ) : (
              renderConversationPanel()
            )}
          </div>
        </div>
      )}

      {/* IN-APP FILE PREVIEW MODAL */}
      {previewFile && (
        <div className="fixed inset-0 bg-[#081529]/60 backdrop-blur-xs z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-[0_24px_60px_rgba(8,20,48,0.3)] border border-white">
            <div className="bg-gradient-to-r from-[#0C234B] via-[#102E63] to-[#1D4ED8] text-white px-5 py-3.5 flex items-center justify-between gap-3 shrink-0 shadow-sm">
              <p className="text-xs sm:text-sm font-bold truncate">{previewFile.name}</p>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewFile.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition"
                >
                  Open in Tab
                </a>
                <a
                  href={previewFile.url}
                  download={previewFile.name}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white text-xs font-bold shadow-sm transition"
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

            <div className="flex-1 overflow-auto bg-[#EFF4FB] p-4 flex items-center justify-center min-h-[300px]">
              {["jpg", "jpeg", "png", "webp", "gif"].includes(previewFile.ext) ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="max-w-full max-h-[72vh] rounded-xl object-contain shadow-xs"
                />
              ) : previewFile.ext === "pdf" ? (
                <iframe
                  src={previewFile.url}
                  title={previewFile.name}
                  className="w-full h-[72vh] rounded-xl border border-slate-300 bg-white"
                />
              ) : ["txt", "csv", "json", "md", "js", "html", "css"].includes(previewFile.ext) ? (
                <div className="w-full h-[65vh] bg-white rounded-xl border border-slate-200 p-4 overflow-auto">
                  {loadingPreviewText ? (
                    <p className="text-xs text-slate-400">Loading text...</p>
                  ) : (
                    <pre className="text-xs text-slate-800 whitespace-pre-wrap font-mono">
                      {previewTextContent}
                    </pre>
                  )}
                </div>
              ) : (
                <div className="text-center p-8 bg-white rounded-xl border border-slate-200 max-w-sm">
                  <FileText className="w-10 h-10 text-[#2563EB] mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-900">{previewFile.name}</p>
                  <p className="text-xs text-slate-500 mt-1">Download document to view locally.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default FloatingChatWidget;