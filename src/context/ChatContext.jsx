import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import { apiCall, API_BASE_URL } from "../services/api";

const ChatContext = createContext(null);

const resolveSocketServerUrl = () => {
  const fromApi = API_BASE_URL.replace(/\/api\/?$/, "");
  if (fromApi) return fromApi;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:5000";
    }
  }
  return "https://apinstitute.localpro1.net";
};

const SOCKET_SERVER_URL = resolveSocketServerUrl();

const getTokenForSession = (session) => {
  if (session === "admin") return localStorage.getItem("adminToken");
  if (session === "teacher") return localStorage.getItem("teacherToken");
  if (session === "student") return localStorage.getItem("studentToken");
  return (
    localStorage.getItem("adminToken") ||
    localStorage.getItem("teacherToken") ||
    localStorage.getItem("studentToken")
  );
};

const buildRoomId = (id1, id2) => {
  return [String(id1), String(id2)].sort().join("_");
};

const playNotificationSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1180, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Ignore autoplay restriction before first tap
  }
};

const triggerBrowserNotification = (title, body) => {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    try {
      new Notification(title, {
        body,
        icon: "/institute-logo.png",
        badge: "/institute-logo.png",
      });
    } catch {
      // Fallback for mobile browsers
    }
  }
};

export function ChatProvider({ session, children }) {
  const [socketConnected, setSocketConnected] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [messagesByPartner, setMessagesByPartner] = useState({});
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [activePartnerId, setActivePartnerId] = useState(null);
  const [adminConversations, setAdminConversations] = useState([]);
  const [adminRoomMessages, setAdminRoomMessages] = useState({});
  const [toastAlert, setToastAlert] = useState(null);

  const socketRef = useRef(null);
  const activePartnerRef = useRef(null);
  const prevUnreadTotalRef = useRef(0);

  useEffect(() => {
    activePartnerRef.current = activePartnerId;
  }, [activePartnerId]);

  const currentUser = useMemo(() => {
    try {
      if (session === "admin") {
        return JSON.parse(localStorage.getItem("adminUser") || "null");
      }
      if (session === "teacher") {
        return JSON.parse(localStorage.getItem("teacherUser") || "null");
      }
      if (session === "student") {
        return JSON.parse(localStorage.getItem("studentUser") || "null");
      }
    } catch {
      return null;
    }
    return null;
  }, [session]);

  const currentUserId = String(currentUser?._id || currentUser?.id || "");
  const currentUserRole = String(session || currentUser?.role || "").toLowerCase();

  const requestNotificationPermission = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const refreshContacts = useCallback(async () => {
    if (!session) return;
    const res = await apiCall("/chat/contacts", "GET");
    if (res.success && Array.isArray(res.data?.data?.contacts)) {
      const freshContacts = res.data.data.contacts;
      setContacts(freshContacts);

      // Play sound if unread count increased while polling
      const newUnread = freshContacts.reduce(
        (sum, c) => sum + (c.unreadCount || 0),
        0
      );
      if (newUnread > prevUnreadTotalRef.current && prevUnreadTotalRef.current >= 0) {
        const newestUnread = freshContacts.find(
          (c) =>
            (c.unreadCount || 0) > 0 &&
            String(c._id) !== String(activePartnerRef.current)
        );
        if (newestUnread && prevUnreadTotalRef.current !== 0) {
          playNotificationSound();
          triggerBrowserNotification(
            `${newestUnread.name}`,
            newestUnread.lastMessage || "New message"
          );
          setToastAlert({
            id: Date.now(),
            senderId: String(newestUnread._id),
            senderName: newestUnread.name,
            senderRole: newestUnread.role || "",
            text: newestUnread.lastMessage || "New message",
          });
          setTimeout(() => setToastAlert(null), 4000);
        }
      }
      prevUnreadTotalRef.current = newUnread;
    }
  }, [session]);

  const refreshAdminConversations = useCallback(async () => {
    if (session !== "admin") return;
    const res = await apiCall("/chat/admin/all-conversations", "GET");
    if (res.success && Array.isArray(res.data?.data?.conversations)) {
      setAdminConversations(res.data.data.conversations);
    }
  }, [session]);

  const loadMessagesWithPartner = useCallback(
    async (partnerId, silent = false) => {
      if (!partnerId) return;
      const partnerStr = String(partnerId);
      if (!silent) {
        setActivePartnerId(partnerStr);
      }

      setContacts((prev) =>
        prev.map((c) =>
          String(c._id) === partnerStr ? { ...c, unreadCount: 0 } : c
        )
      );

      if (socketRef.current?.connected) {
        socketRef.current.emit("mark_seen", { senderId: partnerStr });
      }

      const res = await apiCall(`/chat/messages/${partnerStr}`, "GET");
      if (res.success && Array.isArray(res.data?.data?.messages)) {
        const serverMsgs = res.data.data.messages;
        setMessagesByPartner((prev) => {
          const current = prev[partnerStr] || [];
          // Keep any unconfirmed optimistic temp messages while merging server messages
          const pendingTemps = current.filter(
            (m) =>
              String(m._id).startsWith("temp_") &&
              !serverMsgs.some(
                (sm) =>
                  sm.text === m.text &&
                  String(sm.senderId) === String(m.senderId) &&
                  Math.abs(new Date(sm.createdAt) - new Date(m.createdAt)) < 15000
              )
          );
          return {
            ...prev,
            [partnerStr]: [...serverMsgs, ...pendingTemps],
          };
        });
      }
    },
    []
  );

  const loadAdminRoomMessages = useCallback(async (roomId) => {
    if (!roomId) return;
    const res = await apiCall(`/chat/admin/room/${roomId}`, "GET");
    if (res.success && Array.isArray(res.data?.data?.messages)) {
      setAdminRoomMessages((prev) => ({
        ...prev,
        [roomId]: res.data.data.messages,
      }));
    }
  }, []);

  // REAL-TIME FALLBACK POLLING: Every 2 seconds when WebSocket is blocked by hosting proxy
  useEffect(() => {
    if (!session || socketConnected) return;

    const intervalId = setInterval(() => {
      if (document.hidden) return;
      refreshContacts();
      if (activePartnerRef.current) {
        loadMessagesWithPartner(activePartnerRef.current, true);
      }
      if (session === "admin") {
        refreshAdminConversations();
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [
    session,
    socketConnected,
    refreshContacts,
    loadMessagesWithPartner,
    refreshAdminConversations,
  ]);

  useEffect(() => {
    if (!session) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocketConnected(false);
      setContacts([]);
      setMessagesByPartner({});
      return;
    }

    requestNotificationPermission();
    refreshContacts();
    if (session === "admin") {
      refreshAdminConversations();
    }

    const token = getTokenForSession(session);
    if (!token) return;

    const socket = io(SOCKET_SERVER_URL, {
      path: "/socket.io",
      auth: { token },
      transports: ["polling", "websocket"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      refreshContacts();
    });

    socket.on("connect_error", () => {
      setSocketConnected(false);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    socket.on("online_users", (ids) => {
      setOnlineUserIds(Array.isArray(ids) ? ids.map(String) : []);
    });

    socket.on("receive_message", (msg) => {
      const senderIdStr = String(msg.senderId);
      const isCurrentlyOpen = activePartnerRef.current === senderIdStr;

      setMessagesByPartner((prev) => {
        const existing = prev[senderIdStr] || [];
        if (existing.some((m) => String(m._id) === String(msg._id))) {
          return prev;
        }
        return {
          ...prev,
          [senderIdStr]: [...existing, msg],
        };
      });

      const previewText =
        msg.messageType === "task"
          ? `📋 Task: ${msg.task?.title || msg.text}`
          : msg.text || msg.attachmentName || "New message";

      setContacts((prev) => {
        const exists = prev.some((c) => String(c._id) === senderIdStr);
        let updated;

        if (exists) {
          updated = prev.map((c) => {
            if (String(c._id) === senderIdStr) {
              return {
                ...c,
                lastMessage: previewText,
                lastMessageTime: msg.createdAt,
                unreadCount: isCurrentlyOpen ? 0 : (c.unreadCount || 0) + 1,
              };
            }
            return c;
          });
        } else {
          updated = [
            {
              _id: senderIdStr,
              name: msg.senderName || "User",
              subtitle: String(msg.senderRole || "").toUpperCase(),
              role: String(msg.senderRole || "teacher").toLowerCase(),
              photo: "",
              isOnline: true,
              unreadCount: isCurrentlyOpen ? 0 : 1,
              lastMessage: previewText,
              lastMessageTime: msg.createdAt,
            },
            ...prev,
          ];
        }

        return [...updated].sort((a, b) => {
          if (a.lastMessageTime && b.lastMessageTime) {
            return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
          }
          if (a.lastMessageTime) return -1;
          if (b.lastMessageTime) return 1;
          return 0;
        });
      });

      if (isCurrentlyOpen) {
        socket.emit("mark_seen", { senderId: senderIdStr });
      } else {
        playNotificationSound();
        triggerBrowserNotification(
          `${msg.senderName || "New Message"} (${String(msg.senderRole || "").toUpperCase()})`,
          previewText
        );
        setToastAlert({
          id: msg._id || Date.now(),
          senderId: senderIdStr,
          senderName: msg.senderName || "New Message",
          senderRole: msg.senderRole || "",
          text: previewText,
        });
        setTimeout(() => {
          setToastAlert(null);
        }, 4500);
      }
    });

    socket.on("message_sent", (msg) => {
      const receiverIdStr = String(msg.receiverId);
      setMessagesByPartner((prev) => {
        const list = prev[receiverIdStr] || [];
        const hasTemp = msg.tempId && list.some((m) => m._id === msg.tempId);
        if (hasTemp) {
          return {
            ...prev,
            [receiverIdStr]: list.map((m) => (m._id === msg.tempId ? msg : m)),
          };
        }
        if (list.some((m) => String(m._id) === String(msg._id))) {
          return prev;
        }
        return {
          ...prev,
          [receiverIdStr]: [...list, msg],
        };
      });
    });

    socket.on("message_deleted_everyone", ({ messageId, senderId, receiverId, roomId }) => {
      const partnerId =
        String(senderId) === currentUserId ? String(receiverId) : String(senderId);

      setMessagesByPartner((prev) => {
        const list = prev[partnerId];
        if (!list) return prev;
        return {
          ...prev,
          [partnerId]: list.map((m) =>
            String(m._id) === String(messageId)
              ? {
                  ...m,
                  isDeletedForEveryone: true,
                  messageType: "text",
                  text: "🚫 This message was deleted",
                  attachmentUrl: "",
                  attachmentName: "",
                  task: undefined,
                }
              : m
          ),
        };
      });

      setContacts((prev) =>
        prev.map((c) =>
          String(c._id) === partnerId
            ? { ...c, lastMessage: "🚫 This message was deleted" }
            : c
        )
      );

      if (roomId) {
        setAdminRoomMessages((prev) => {
          const list = prev[roomId];
          if (!list) return prev;
          return {
            ...prev,
            [roomId]: list.map((m) =>
              String(m._id) === String(messageId)
                ? {
                    ...m,
                    isDeletedForEveryone: true,
                    messageType: "text",
                    text: "🚫 This message was deleted",
                    attachmentUrl: "",
                    attachmentName: "",
                    task: undefined,
                  }
                : m
            ),
          };
        });
      }
    });

    socket.on("admin_live_message", (msg) => {
      if (session !== "admin") return;
      setAdminRoomMessages((prev) => {
        const list = prev[msg.roomId] || [];
        if (list.some((m) => String(m._id) === String(msg._id))) return prev;
        return {
          ...prev,
          [msg.roomId]: [...list, msg],
        };
      });
      refreshAdminConversations();
    });

    socket.on("user_typing", ({ senderId }) => {
      setTypingUsers((prev) => ({ ...prev, [String(senderId)]: true }));
    });

    socket.on("user_stop_typing", ({ senderId }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[String(senderId)];
        return next;
      });
    });

    socket.on("messages_seen", ({ byUserId }) => {
      const partnerStr = String(byUserId);
      setMessagesByPartner((prev) => {
        const list = prev[partnerStr];
        if (!list) return prev;
        return {
          ...prev,
          [partnerStr]: list.map((m) =>
            String(m.senderId) === currentUserId ? { ...m, status: "seen" } : m
          ),
        };
      });
    });

    socket.on("task_status_updated", (updatedMsg) => {
      const partnerId =
        String(updatedMsg.senderId) === currentUserId
          ? String(updatedMsg.receiverId)
          : String(updatedMsg.senderId);

      setMessagesByPartner((prev) => {
        const list = prev[partnerId];
        if (!list) return prev;
        return {
          ...prev,
          [partnerId]: list.map((m) =>
            String(m._id) === String(updatedMsg._id) ? updatedMsg : m
          ),
        };
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    session,
    currentUserId,
    refreshContacts,
    refreshAdminConversations,
    requestNotificationPermission,
  ]);

  const sendMessage = useCallback(
    async ({
      receiver,
      text = "",
      messageType = "text",
      task = null,
      attachmentUrl = "",
      attachmentName = "",
    }) => {
      if (!receiver?._id) return;
      const receiverIdStr = String(receiver._id);
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      const optimisticMsg = {
        _id: tempId,
        tempId,
        roomId: buildRoomId(currentUserId, receiverIdStr),
        senderId: currentUserId,
        senderRole: currentUserRole,
        senderName: currentUser?.name || "Me",
        receiverId: receiverIdStr,
        receiverRole: receiver.role || "student",
        receiverName: receiver.name || "User",
        messageType,
        text: String(text || "").trim(),
        task,
        attachmentUrl,
        attachmentName,
        status: "sent",
        createdAt: new Date().toISOString(),
      };

      setMessagesByPartner((prev) => ({
        ...prev,
        [receiverIdStr]: [...(prev[receiverIdStr] || []), optimisticMsg],
      }));

      const previewText =
        messageType === "task"
          ? `📋 Task: ${task?.title || text}`
          : text || attachmentName;

      setContacts((prev) =>
        prev.map((c) =>
          String(c._id) === receiverIdStr
            ? {
                ...c,
                lastMessage: previewText,
                lastMessageTime: optimisticMsg.createdAt,
              }
            : c
        )
      );

      const payload = {
        receiverId: receiverIdStr,
        receiverRole: receiver.role || "student",
        receiverName: receiver.name || "User",
        text,
        messageType,
        task,
        attachmentUrl,
        attachmentName,
        tempId,
      };

      if (socketRef.current?.connected) {
        socketRef.current.emit("send_message", payload, async (ack) => {
          if (ack?.success && ack.message) {
            setMessagesByPartner((prev) => ({
              ...prev,
              [receiverIdStr]: (prev[receiverIdStr] || []).map((m) =>
                m._id === tempId ? ack.message : m
              ),
            }));
          } else {
            const fallbackRes = await apiCall("/chat/send", "POST", payload);
            const saved = fallbackRes.data?.data?.message;
            if (fallbackRes.success && saved) {
              setMessagesByPartner((prev) => ({
                ...prev,
                [receiverIdStr]: (prev[receiverIdStr] || []).map((m) =>
                  m._id === tempId ? saved : m
                ),
              }));
            }
          }
        });
      } else {
        const fallbackRes = await apiCall("/chat/send", "POST", payload);
        const saved = fallbackRes.data?.data?.message;
        if (fallbackRes.success && saved) {
          setMessagesByPartner((prev) => ({
            ...prev,
            [receiverIdStr]: (prev[receiverIdStr] || []).map((m) =>
              m._id === tempId ? saved : m
            ),
          }));
        }
      }
    },
    [currentUser, currentUserId, currentUserRole]
  );

  const deleteMessage = useCallback(async (partnerId, messageId, mode = "me") => {
    const partnerStr = String(partnerId);
    const msgIdStr = String(messageId);

    if (mode === "me") {
      setMessagesByPartner((prev) => ({
        ...prev,
        [partnerStr]: (prev[partnerStr] || []).filter(
          (m) => String(m._id) !== msgIdStr
        ),
      }));
    } else {
      setMessagesByPartner((prev) => ({
        ...prev,
        [partnerStr]: (prev[partnerStr] || []).map((m) =>
          String(m._id) === msgIdStr
            ? {
                ...m,
                isDeletedForEveryone: true,
                messageType: "text",
                text: "🚫 This message was deleted",
                attachmentUrl: "",
                attachmentName: "",
                task: undefined,
              }
            : m
        ),
      }));
    }

    if (!msgIdStr.startsWith("temp_")) {
      await apiCall(`/chat/message/${msgIdStr}?mode=${mode}`, "DELETE");
    }
  }, []);

  const clearChatWithPartner = useCallback(async (partnerId) => {
    const partnerStr = String(partnerId);
    setMessagesByPartner((prev) => ({
      ...prev,
      [partnerStr]: [],
    }));
    setContacts((prev) =>
      prev.map((c) =>
        String(c._id) === partnerStr
          ? { ...c, lastMessage: "", lastMessageTime: null, unreadCount: 0 }
          : c
      )
    );
    await apiCall(`/chat/conversation/${partnerStr}`, "DELETE");
  }, []);

  const deleteAdminMonitorRoom = useCallback(async (roomId) => {
    await apiCall(`/chat/admin/room/${roomId}`, "DELETE");
    setAdminConversations((prev) => prev.filter((c) => c._id !== roomId));
    setAdminRoomMessages((prev) => {
      const next = { ...prev };
      delete next[roomId];
      return next;
    });
  }, []);

  const emitTyping = useCallback((receiverId) => {
    if (socketRef.current?.connected && receiverId) {
      socketRef.current.emit("typing", { receiverId: String(receiverId) });
    }
  }, []);

  const emitStopTyping = useCallback((receiverId) => {
    if (socketRef.current?.connected && receiverId) {
      socketRef.current.emit("stop_typing", { receiverId: String(receiverId) });
    }
  }, []);

  const updateTaskStatus = useCallback(async (messageId, status) => {
    const res = await apiCall(`/chat/task/${messageId}/status`, "PATCH", {
      status,
    });
    return res;
  }, []);

  const totalUnreadCount = useMemo(() => {
    return contacts.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  }, [contacts]);

  const value = {
    socketConnected,
    currentUser,
    currentUserId,
    currentUserRole,
    contacts,
    refreshContacts,
    messagesByPartner,
    activePartnerId,
    setActivePartnerId,
    loadMessagesWithPartner,
    sendMessage,
    deleteMessage,
    clearChatWithPartner,
    onlineUserIds,
    typingUsers,
    emitTyping,
    emitStopTyping,
    updateTaskStatus,
    totalUnreadCount,
    adminConversations,
    refreshAdminConversations,
    adminRoomMessages,
    loadAdminRoomMessages,
    deleteAdminMonitorRoom,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}

      {toastAlert && (
        <div className="fixed top-4 right-4 z-[9999] max-w-xs w-full bg-[#075E54] text-white rounded-2xl shadow-2xl p-3.5 border border-emerald-400/30">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-wider text-emerald-200">
                💬 {toastAlert.senderName} ({toastAlert.senderRole})
              </p>
              <p className="text-xs text-white truncate mt-0.5">
                {toastAlert.text}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setToastAlert(null)}
              className="text-emerald-200 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);