import { useEffect, useRef, useState } from "react";
import {
  createChatMessageApi,
  getChatMessagesApi,
  unsendChatMessageApi,
  updateChatMessageApi,
} from "../../api/chatApi";
import { USER_API_URL } from "../../api/userApi";
import { getUser } from "../../utils/auth";
import { formatUserDateTime } from "../../utils/dateTime";
import { startMovingBrowserTitle, stopMovingBrowserTitle } from "../../utils/browserTitle";

const messageLimit = 25;
const unreadPreviewLimit = 10;
const iconsPerPage = 28;
const chatLeftNoticeDelayMs = 5000;
const duplicateJoinNoticeWindowMs = 30000;
const chatIconCategories = [
  {
    id: "smileys",
    label: "Smileys",
    icon: "😀",
    icons: ["😀", "😃", "😄", "😁", "😆", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😍", "🥰", "😘", "😋", "😎", "🤩", "🥳", "😏", "😒", "😔", "😢", "😭", "😤", "😡", "🤬", "😱", "😴", "🤔", "🤫", "🤐", "🙄", "😬", "🤢", "🤮", "🤯"],
  },
  {
    id: "people",
    label: "People",
    icon: "👍",
    icons: ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "👊", "✊", "👏", "🙌", "🙏", "💪", "🫡", "👋", "🤝", "🫶", "👀", "🧠", "👑", "🥷", "🧙", "🧛", "🦸", "🦹", "🧝", "🧟", "🏃", "🕺", "💃"],
  },
  {
    id: "nature",
    label: "Nature",
    icon: "🌿",
    icons: ["🌿", "☘️", "🍀", "🌲", "🌳", "🌴", "🌵", "🌙", "⭐", "✨", "⚡", "🔥", "💧", "🌊", "☀️", "🌤️", "⛈️", "🌈", "❄️", "☄️", "🌍", "🌌"],
  },
  {
    id: "food",
    label: "Food",
    icon: "🍕",
    icons: ["🍏", "🍎", "🍌", "🍇", "🍓", "🍒", "🍍", "🥑", "🍔", "🍟", "🍕", "🌭", "🥪", "🌮", "🍜", "🍣", "🍱", "🍗", "🍖", "🍰", "🍪", "🍫", "☕", "🍺", "🍻", "🥂"],
  },
  {
    id: "activity",
    label: "Activity",
    icon: "🏆",
    icons: ["⚔️", "🛡️", "🏆", "🥇", "🎯", "🎮", "🕹️", "🎲", "♟️", "🎰", "🎧", "🎤", "🎬", "🎨", "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏓", "🥊", "🏹", "🎣"],
  },
  {
    id: "objects",
    label: "Objects",
    icon: "💎",
    icons: ["💎", "🔔", "📣", "📌", "📍", "🧭", "⏰", "⌛", "🔒", "🔑", "🧰", "🪓", "🔨", "⚙️", "🧨", "💣", "🔮", "🪄", "🧪", "💊", "📜", "📝", "📦", "🎁", "💰", "🪙"],
  },
  {
    id: "symbols",
    label: "Symbols",
    icon: "❤️",
    icons: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "💯", "✅", "❌", "⭕", "⚠️", "🚫", "💢", "♻️", "🔰", "🔱", "⚜️", "🔆", "🔅", "⬆️", "⬇️", "➡️", "⬅️", "🔴", "🟠", "🟡", "🟢", "🔵", "🟣"],
  },
];

const formatMessageTime = (value) => formatUserDateTime(value);

const getAvatarUrl = (avatarUrl) => {
  if (!avatarUrl) {
    return null;
  }

  return avatarUrl.startsWith("http") ? avatarUrl : `${USER_API_URL}${avatarUrl}`;
};

function ChatWidget() {
  const currentUser = getUser();
  const readStorageKey = `warlords_chat_last_read_${currentUser?.id || "guest"}`;
  const unreadStorageKey = `warlords_chat_unread_count_${currentUser?.id || "guest"}`;
  const unreadTitleStorageKey = `warlords_chat_unread_title_${currentUser?.id || "guest"}`;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [hasLoadedMessages, setHasLoadedMessages] = useState(false);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editDraft, setEditDraft] = useState("");
  const [isUpdatingMessage, setIsUpdatingMessage] = useState(false);
  const [unsendingMessageId, setUnsendingMessageId] = useState(null);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [activeIconCategory, setActiveIconCategory] = useState(chatIconCategories[0].id);
  const [activeIconPage, setActiveIconPage] = useState(0);
  const [onlineMemberCount, setOnlineMemberCount] = useState(0);
  const [isWindowFocused, setIsWindowFocused] = useState(() => document.hasFocus());
  const [lastReadMessageId, setLastReadMessageId] = useState(() => Number(localStorage.getItem(readStorageKey) || 0));
  const [unreadCount, setUnreadCount] = useState(() => Number(localStorage.getItem(unreadStorageKey) || 0));
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const readTimerRef = useRef(null);
  const iconPickerRef = useRef(null);
  const pendingChatLeftTimersRef = useRef(new Map());
  const recentChatJoinNoticesRef = useRef(new Map());

  const canMarkRead = isOpen && isWindowFocused;

  const setStoredUnreadCount = (count) => {
    const nextCount = Math.min(Number(count) || 0, 99);

    localStorage.setItem(unreadStorageKey, String(nextCount));
    setUnreadCount(nextCount);
  };

  const setStoredUnreadTitle = (title) => {
    if (title) {
      localStorage.setItem(unreadTitleStorageKey, title);
      startMovingBrowserTitle(title);
    } else {
      localStorage.removeItem(unreadTitleStorageKey);
      stopMovingBrowserTitle();
    }
  };

  const getUnreadMessages = (messageList, readMessageId = lastReadMessageId) => (
    messageList.filter((message) => (
      message.type !== "system" && message.id > readMessageId && message.user?.id !== currentUser?.id
    ))
  );

  const showLatestUnreadInTitle = (messageList, readMessageId = lastReadMessageId) => {
    const unreadMessages = getUnreadMessages(messageList, readMessageId);
    const latestUnreadMessage = unreadMessages[unreadMessages.length - 1];

    if (!latestUnreadMessage) {
      setStoredUnreadTitle("");
      return;
    }

    const senderName = latestUnreadMessage.user?.full_name || latestUnreadMessage.user?.email || "Someone";
    setStoredUnreadTitle(`${senderName} sent a new message`);
  };

  const markMessagesRead = (messageList = messages) => {
    const latestMessageId = Math.max(
      0,
      ...messageList
        .filter((message) => message.type !== "system")
        .map((message) => message.id),
    );

    if (latestMessageId <= 0) {
      return;
    }

    localStorage.setItem(readStorageKey, String(latestMessageId));
    setLastReadMessageId(latestMessageId);
    setStoredUnreadCount(0);
    setStoredUnreadTitle("");
  };

  const scheduleMarkRead = (messageList = messages) => {
    window.clearTimeout(readTimerRef.current);

    if (!canMarkRead) {
      return;
    }

    readTimerRef.current = window.setTimeout(() => {
      markMessagesRead(messageList);
    }, 300);
  };

  const scrollToBottom = () => {
    window.setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 50);
  };

  const mergeMessages = (incomingMessages, { prepend = false } = {}) => {
    setMessages((currentMessages) => {
      const messagesById = new Map();
      const nextMessages = prepend
        ? [...incomingMessages, ...currentMessages]
        : [...currentMessages, ...incomingMessages];

      nextMessages.forEach((message) => messagesById.set(message.id, message));

      return [...messagesById.values()].sort((first, second) => first.id - second.id);
    });
  };

  const updateUnreadPreview = async () => {
    try {
      const data = await getChatMessagesApi({ limit: unreadPreviewLimit });
      const unreadMessages = getUnreadMessages(data);
      setStoredUnreadCount(unreadMessages.length);
      showLatestUnreadInTitle(data);
    } catch {
      // Keep chat quiet when only the unread preview fails.
    }
  };

  const loadMessages = async ({ showLoading = false } = {}) => {
    if (showLoading) {
      setIsLoading(true);
    }
    setError("");

    try {
      const data = await getChatMessagesApi({ limit: messageLimit });
      setMessages(data);
      setHasLoadedMessages(true);
      setHasOlderMessages(data.length === messageLimit);
      if (canMarkRead) {
        scheduleMarkRead(data);
      } else {
        const unreadMessages = getUnreadMessages(data);
        setStoredUnreadCount(unreadMessages.length);
        showLatestUnreadInTitle(data);
      }
      scrollToBottom();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load chat messages");
    } finally {
      setIsLoading(false);
    }
  };

  const loadOlderMessages = async () => {
    if (!messages.length || isLoadingOlder) {
      return;
    }

    setIsLoadingOlder(true);
    setError("");

    try {
      const data = await getChatMessagesApi({
        limit: messageLimit,
        beforeId: messages[0].id,
      });
      mergeMessages(data, { prepend: true });
      setHasOlderMessages(data.length === messageLimit);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load older messages");
    } finally {
      setIsLoadingOlder(false);
    }
  };

  const startEditingMessage = (message) => {
    setEditingMessageId(message.id);
    setEditDraft(message.message || "");
    setError("");
  };

  const cancelEditingMessage = () => {
    setEditingMessageId(null);
    setEditDraft("");
  };

  const handleEditMessage = async (event, messageId) => {
    event.preventDefault();
    const nextMessage = editDraft.trim();

    if (!nextMessage || isUpdatingMessage) {
      return;
    }

    setIsUpdatingMessage(true);
    setError("");

    try {
      const updatedMessage = await updateChatMessageApi(messageId, nextMessage);
      mergeMessages([updatedMessage]);
      cancelEditingMessage();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to edit message");
    } finally {
      setIsUpdatingMessage(false);
    }
  };

  const handleUnsendMessage = async (message) => {
    if (unsendingMessageId || !window.confirm("Unsend this message? Everyone will see that you unsent it.")) {
      return;
    }

    setUnsendingMessageId(message.id);
    setError("");

    try {
      const updatedMessage = await unsendChatMessageApi(message.id);
      mergeMessages([updatedMessage]);
      if (editingMessageId === message.id) {
        cancelEditingMessage();
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to unsend message");
    } finally {
      setUnsendingMessageId(null);
    }
  };

  useEffect(() => {
    const storedUnreadTitle = localStorage.getItem(unreadTitleStorageKey);
    if (storedUnreadTitle && unreadCount > 0) {
      startMovingBrowserTitle(storedUnreadTitle);
    }
    updateUnreadPreview();
  }, []);

  useEffect(() => {
    if (isOpen && !hasLoadedMessages) {
      loadMessages({ showLoading: true });
    }

    if (canMarkRead && hasLoadedMessages && messages.length > 0) {
      scheduleMarkRead(messages);
    } else if (hasLoadedMessages) {
      const unreadMessages = getUnreadMessages(messages);
      setStoredUnreadCount(unreadMessages.length);
      showLatestUnreadInTitle(messages);
    }
  }, [isOpen, isWindowFocused, messages, hasLoadedMessages]);

  useEffect(() => {
    const handleFocus = () => setIsWindowFocused(true);
    const handleBlur = () => setIsWindowFocused(false);
    const handleVisibilityChange = () => setIsWindowFocused(document.hasFocus() && !document.hidden);

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearTimeout(readTimerRef.current);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const handleChatMessageCreated = (event) => {
      const message = event.detail?.message || event.detail;
      const senderName = message?.user?.full_name || message?.user?.email || "Someone";
      const isMine = message?.user?.id === currentUser?.id;

      if (message && !isMine && !canMarkRead) {
        setStoredUnreadTitle(`${senderName} sent a new message`);
      }

      if (!canMarkRead && !isMine) {
        const currentStoredUnreadCount = Number(localStorage.getItem(unreadStorageKey) || unreadCount || 0);
        setStoredUnreadCount(currentStoredUnreadCount + 1);
      }

      if (isOpen && message) {
        mergeMessages([message]);
        scrollToBottom();
      } else if (isOpen) {
        loadMessages();
      }
    };

    window.addEventListener("warlords:chat-message-created", handleChatMessageCreated);
    return () => window.removeEventListener("warlords:chat-message-created", handleChatMessageCreated);
  }, [canMarkRead, currentUser?.id, isOpen, unreadCount, unreadStorageKey]);

  useEffect(() => {
    const handleChatMessageUpdated = (event) => {
      const message = event.detail?.message || event.detail;

      if (!message) {
        return;
      }

      mergeMessages([message]);
    };

    window.addEventListener("warlords:chat-message-updated", handleChatMessageUpdated);
    return () => window.removeEventListener("warlords:chat-message-updated", handleChatMessageUpdated);
  }, []);

  useEffect(() => {
    const pendingLeftTimers = pendingChatLeftTimersRef.current;
    const recentJoinNotices = recentChatJoinNoticesRef.current;

    const createSystemMessage = (event, actionText, dateField) => {
      const user = event.detail?.user;
      if (!user || user.id === currentUser?.id) {
        return null;
      }

      const displayName = user.full_name || user.email || "A user";
      return {
        id: `${actionText}-${user.id}-${event.detail?.[dateField] || Date.now()}`,
        type: "system",
        message: `${displayName} ${actionText} the chat`,
        created_at: event.detail?.[dateField] || new Date().toISOString(),
      };
    };

    const addSystemMessage = (systemMessage) => {
      if (!systemMessage || !isOpen) {
        return;
      }

      setMessages((currentMessages) => [...currentMessages, systemMessage]);
      scrollToBottom();
    };

    const handleChatUserJoined = (event) => {
      const user = event.detail?.user;
      if (!user || user.id === currentUser?.id) {
        return;
      }

      const pendingLeftTimer = pendingLeftTimers.get(user.id);
      if (pendingLeftTimer) {
        window.clearTimeout(pendingLeftTimer);
        pendingLeftTimers.delete(user.id);
        return;
      }

      const joinedAt = Date.parse(event.detail?.joined_at || "") || Date.now();
      const lastJoinNoticeAt = recentJoinNotices.get(user.id) || 0;
      if (joinedAt - lastJoinNoticeAt < duplicateJoinNoticeWindowMs) {
        return;
      }

      recentJoinNotices.set(user.id, joinedAt);
      addSystemMessage(createSystemMessage(event, "joined", "joined_at"));
    };

    const handleChatUserLeft = (event) => {
      const user = event.detail?.user;
      if (!user || user.id === currentUser?.id) {
        return;
      }

      const currentTimer = pendingLeftTimers.get(user.id);
      if (currentTimer) {
        window.clearTimeout(currentTimer);
      }

      const timerId = window.setTimeout(() => {
        pendingLeftTimers.delete(user.id);
        addSystemMessage(createSystemMessage(event, "left", "left_at"));
      }, chatLeftNoticeDelayMs);

      pendingLeftTimers.set(user.id, timerId);
    };

    window.addEventListener("warlords:chat-user-joined", handleChatUserJoined);
    window.addEventListener("warlords:chat-user-left", handleChatUserLeft);
    return () => {
      pendingLeftTimers.forEach((timerId) => window.clearTimeout(timerId));
      pendingLeftTimers.clear();
      window.removeEventListener("warlords:chat-user-joined", handleChatUserJoined);
      window.removeEventListener("warlords:chat-user-left", handleChatUserLeft);
    };
  }, [currentUser?.id, isOpen]);

  useEffect(() => {
    if (!isIconPickerOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!iconPickerRef.current?.contains(event.target)) {
        setIsIconPickerOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isIconPickerOpen]);

  useEffect(() => {
    const handleOnlineUsersUpdated = (event) => {
      setOnlineMemberCount(Array.isArray(event.detail) ? event.detail.length : 0);
    };

    window.addEventListener("warlords:online-users-updated", handleOnlineUsersUpdated);
    return () => window.removeEventListener("warlords:online-users-updated", handleOnlineUsersUpdated);
  }, []);

  useEffect(() => {
    setActiveIconPage(0);
  }, [activeIconCategory]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    document.body.classList.add("chat-scroll-lock");
    return () => document.body.classList.remove("chat-scroll-lock");
  }, [isOpen]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const message = draft.trim();

    if (!message || isSending) {
      return;
    }

    setIsSending(true);
    setError("");

    try {
      const savedMessage = await createChatMessageApi(message);
      mergeMessages([savedMessage]);
      setDraft("");
      scrollToBottom();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleIconClick = (icon) => {
    setDraft((currentDraft) => `${currentDraft}${icon}`);
    setIsIconPickerOpen(false);
  };

  const selectedIconCategory = chatIconCategories.find((category) => category.id === activeIconCategory) || chatIconCategories[0];
  const selectedIconPages = selectedIconCategory.icons.reduce((pages, icon, index) => {
    const pageIndex = Math.floor(index / iconsPerPage);
    if (!pages[pageIndex]) {
      pages[pageIndex] = [];
    }
    pages[pageIndex].push(icon);
    return pages;
  }, []);

  return (
    <div className="chat-widget">
      {isOpen && (
        <>
          <button
            type="button"
            className="chat-mobile-overlay"
            aria-label="Close chat"
            onClick={() => setIsOpen(false)}
          ></button>
          <section
            className="chat-panel shadow-lg"
            aria-label="Team chat"
            onClick={() => markMessagesRead(messages)}
            onFocusCapture={() => markMessagesRead(messages)}
          >
            <div className="chat-panel-header">
              <div>
                <h5 className="mb-0">Warlords Chat</h5>
                <p className="small mb-0 text-muted">
                  {onlineMemberCount} {onlineMemberCount === 1 ? "member" : "members"} online
                </p>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                <i className="bi bi-x-lg" aria-hidden="true"></i>
              </button>
            </div>

          <div className="chat-messages">
            {hasOlderMessages && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary align-self-center"
                onClick={loadOlderMessages}
                disabled={isLoadingOlder}
              >
                {isLoadingOlder ? "Loading..." : "Load older"}
              </button>
            )}

            {isLoading ? (
              <p className="small text-muted text-center mb-0 py-4">Loading messages...</p>
            ) : messages.length === 0 ? (
              <p className="small text-muted text-center mb-0 py-4">No chat messages yet.</p>
            ) : (
              messages.map((message) => {
                if (message.type === "system") {
                  return (
                    <div className="chat-system-message" key={message.id}>
                      <span>{message.message}</span>
                      <time>{formatMessageTime(message.created_at)}</time>
                    </div>
                  );
                }

                const isMine = message.user?.id === currentUser?.id;
                const isUnread = !isMine && message.id > lastReadMessageId;
                const displayName = message.user?.full_name || message.user?.email || "Unknown user";
                const avatarUrl = getAvatarUrl(message.user?.avatar_url);
                const isEditing = editingMessageId === message.id;
                const isUnsent = Boolean(message.is_unsent);
                const unsentText = isMine ? "You unsent a message" : `${displayName} unsent a message`;

                return (
                  <article className={`chat-message ${isMine ? "mine" : ""} ${isUnread ? "unread" : ""} ${isUnsent ? "unsent" : ""}`} key={message.id}>
                    {!isMine && (
                      <div className="chat-avatar">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={displayName} />
                        ) : (
                          <span>{displayName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                    )}
                    <div className="chat-message-body">
                      <div className="chat-message-meta">
                        <span>{isMine ? "You" : displayName}</span>
                        <time>{formatMessageTime(message.created_at)}</time>
                        {message.edited_at && !isUnsent && <em>edited</em>}
                      </div>
                      {isUnsent ? (
                        <p className="chat-unsent-message">
                          <i className="bi bi-slash-circle" aria-hidden="true"></i>
                          {unsentText}
                        </p>
                      ) : isEditing ? (
                        <form className="chat-edit-form" onSubmit={(event) => handleEditMessage(event, message.id)}>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={editDraft}
                            maxLength={1000}
                            autoFocus
                            onChange={(event) => setEditDraft(event.target.value)}
                          />
                          <div className="chat-edit-actions">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={cancelEditingMessage}
                              disabled={isUpdatingMessage}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="btn btn-sm btn-success"
                              disabled={isUpdatingMessage || !editDraft.trim()}
                            >
                              {isUpdatingMessage ? "Saving..." : "Save"}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <p>{message.message}</p>
                          {isMine && (
                            <div className="chat-message-actions">
                              <button
                                type="button"
                                className="btn btn-sm btn-link"
                                onClick={() => startEditingMessage(message)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-link text-danger"
                                onClick={() => handleUnsendMessage(message)}
                                disabled={unsendingMessageId === message.id}
                              >
                                {unsendingMessageId === message.id ? "Unsending..." : "Unsend"}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </article>
                );
              })
            )}
            <div ref={messagesEndRef}></div>
          </div>

          {error && <div className="small text-danger px-3 pb-2">{error}</div>}

          <form className="chat-compose" onSubmit={handleSubmit}>
            {isIconPickerOpen && (
              <div className="chat-icon-picker" ref={iconPickerRef}>
                <div className="chat-icon-picker-header">
                  <span className="small fw-semibold">Icons</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setIsIconPickerOpen(false)}
                    aria-label="Close icon picker"
                  >
                    <i className="bi bi-x-lg" aria-hidden="true"></i>
                  </button>
                </div>
                <div className="chat-icon-tabs" role="tablist" aria-label="Chat icon categories">
                  {chatIconCategories.map((category) => (
                    <button
                      type="button"
                      className={`chat-icon-tab ${category.id === activeIconCategory ? "active" : ""}`}
                      key={category.id}
                      title={category.label}
                      aria-label={category.label}
                      aria-selected={category.id === activeIconCategory}
                      onClick={() => setActiveIconCategory(category.id)}
                    >
                      {category.icon}
                    </button>
                  ))}
                </div>
                <div className="chat-icon-grid">
                  <div
                    className="chat-icon-slider"
                    style={{ transform: `translateX(-${activeIconPage * 100}%)` }}
                  >
                    {selectedIconPages.map((pageIcons, pageIndex) => (
                      <div className="chat-icon-page" key={`${selectedIconCategory.id}-${pageIndex}`}>
                        {pageIcons.map((icon) => (
                          <button
                            type="button"
                            className="chat-icon-option"
                            key={`${selectedIconCategory.id}-${pageIndex}-${icon}`}
                            onClick={() => handleIconClick(icon)}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                {selectedIconPages.length > 1 && (
                  <div className="chat-icon-dots" aria-label="Icon pages">
                    {selectedIconPages.map((_, pageIndex) => (
                      <button
                        type="button"
                        className={`chat-icon-dot ${pageIndex === activeIconPage ? "active" : ""}`}
                        key={`${selectedIconCategory.id}-dot-${pageIndex}`}
                        aria-label={`Show icon page ${pageIndex + 1}`}
                        onClick={() => setActiveIconPage(pageIndex)}
                      ></button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="chat-compose-input">
              <input
                type="text"
                className="form-control"
                placeholder="Type a message..."
                value={draft}
                maxLength={1000}
                onChange={(event) => setDraft(event.target.value)}
              />
              <button
                type="button"
                className="btn btn-outline-secondary chat-icon-picker-toggle"
                onClick={() => setIsIconPickerOpen((value) => !value)}
                aria-label="Choose chat icon"
              >
                <i className="bi bi-emoji-smile" aria-hidden="true"></i>
              </button>
            </div>
            <button type="submit" className="btn btn-success" disabled={isSending || !draft.trim()}>
              <i className="bi bi-send" aria-hidden="true"></i>
            </button>
          </form>
          </section>
        </>
      )}

      <button
        type="button"
        className="chat-toggle-button shadow"
        onClick={() => setIsOpen((value) => !value)}
        aria-label="Open chat"
      >
        <i className={`bi ${isOpen ? "bi-chat-dots-fill" : "bi-chat-dots"}`} aria-hidden="true"></i>
        {unreadCount > 0 && (
          <span className="chat-unread-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}

export default ChatWidget;
