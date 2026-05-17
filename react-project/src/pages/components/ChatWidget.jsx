import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  createChatMessageApi,
  getChatMessagesApi,
  searchChatMessagesApi,
  unsendChatMessageApi,
  updateChatMessageApi,
} from "../../api/chatApi";
import { USER_API_URL } from "../../api/userApi";
import { getUser } from "../../utils/auth";
import { formatUserDateTime } from "../../utils/dateTime";
import { startMovingBrowserTitle, stopMovingBrowserTitle } from "../../utils/browserTitle";

const messageLimit = 25;
const unreadPreviewLimit = 100;
const iconsPerPage = 28;
const chatLeftNoticeDelayMs = 5000;
const duplicateJoinNoticeWindowMs = 30000;
const readDelayMs = 5000;
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

const getMessageOrder = (message) => {
  const numericId = Number(message.id);

  if (Number.isFinite(numericId)) {
    return numericId;
  }

  return new Date(message.created_at || 0).getTime();
};

const sortChatMessages = (messageList) => (
  [...messageList].sort((first, second) => getMessageOrder(first) - getMessageOrder(second))
);

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
  const [isSearchingMessages, setIsSearchingMessages] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editDraft, setEditDraft] = useState("");
  const [isUpdatingMessage, setIsUpdatingMessage] = useState(false);
  const [unsendingMessageId, setUnsendingMessageId] = useState(null);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchedMessageIds, setSearchedMessageIds] = useState([]);
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  const [activeIconCategory, setActiveIconCategory] = useState(chatIconCategories[0].id);
  const [activeIconPage, setActiveIconPage] = useState(0);
  const [onlineMemberCount, setOnlineMemberCount] = useState(0);
  const [isWindowFocused, setIsWindowFocused] = useState(() => document.hasFocus());
  const [lastReadMessageId, setLastReadMessageId] = useState(() => Number(localStorage.getItem(readStorageKey) || 0));
  const [highlightReadMessageId, setHighlightReadMessageId] = useState(() => Number(localStorage.getItem(readStorageKey) || 0));
  const [unreadCount, setUnreadCount] = useState(() => Number(localStorage.getItem(unreadStorageKey) || 0));
  const [error, setError] = useState("");
  const messagesListRef = useRef(null);
  const messagesEndRef = useRef(null);
  const readTimerRef = useRef(null);
  const iconPickerRef = useRef(null);
  const previousMessagesAnchorRef = useRef(null);
  const isOpeningMessagesRef = useRef(false);
  const searchRequestIdRef = useRef(0);
  const pendingChatLeftTimersRef = useRef(new Map());
  const recentChatJoinNoticesRef = useRef(new Map());

  const canMarkRead = isOpen && isWindowFocused;
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const searchMatchIds = useMemo(() => {
    if (!normalizedSearchTerm) {
      return [];
    }

    const matchedIds = messages
      .filter((message) => (message.message || "").toLowerCase().includes(normalizedSearchTerm))
      .map((message) => String(message.id));

    return [...new Set([...matchedIds, ...searchedMessageIds])];
  }, [messages, normalizedSearchTerm, searchedMessageIds]);
  const activeSearchMatchId = activeSearchIndex >= 0 ? searchMatchIds[activeSearchIndex] : "";

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

  const getLatestChatMessageId = (messageList) => Math.max(
    0,
    ...messageList
      .filter((message) => message.type !== "system")
      .map((message) => message.id),
  );

  const initializeReadMarkerIfMissing = (messageList) => {
    if (localStorage.getItem(readStorageKey) !== null) {
      return false;
    }

    const storedUnreadCount = Number(localStorage.getItem(unreadStorageKey) || 0);
    const storedUnreadTitle = localStorage.getItem(unreadTitleStorageKey);
    if (storedUnreadCount > 0 || storedUnreadTitle) {
      return false;
    }

    const latestMessageId = getLatestChatMessageId(messageList);
    if (latestMessageId <= 0) {
      return false;
    }

    localStorage.setItem(readStorageKey, String(latestMessageId));
    setLastReadMessageId(latestMessageId);
    setHighlightReadMessageId(latestMessageId);
    setStoredUnreadCount(0);
    setStoredUnreadTitle("");
    return true;
  };

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

  const updateUnreadStateFromMessages = (messageList, { preserveExisting = false } = {}) => {
    const unreadMessages = getUnreadMessages(messageList);
    const currentStoredUnreadCount = Number(localStorage.getItem(unreadStorageKey) || unreadCount || 0);
    const shouldKeepExistingBadge = preserveExisting
      && currentStoredUnreadCount > 0
      && unreadMessages.length < currentStoredUnreadCount;

    if (shouldKeepExistingBadge) {
      setUnreadCount(Math.min(currentStoredUnreadCount, 99));
      const storedUnreadTitle = localStorage.getItem(unreadTitleStorageKey);
      if (storedUnreadTitle) {
        startMovingBrowserTitle(storedUnreadTitle);
      }
      return;
    }

    setStoredUnreadCount(unreadMessages.length);
    showLatestUnreadInTitle(messageList);
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
    setHighlightReadMessageId(latestMessageId);
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
    }, readDelayMs);
  };

  const scrollToBottom = ({ behavior = "smooth", protectInitialLoad = false } = {}) => {
    if (protectInitialLoad) {
      isOpeningMessagesRef.current = true;
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const messagesList = messagesListRef.current;

        if (messagesList) {
          messagesList.scrollTop = messagesList.scrollHeight;
        } else {
          messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
        }

        if (protectInitialLoad) {
          window.setTimeout(() => {
            isOpeningMessagesRef.current = false;
          }, 250);
        }
      });
    });
  };

  const mergeMessages = (incomingMessages, { prepend = false } = {}) => {
    setMessages((currentMessages) => {
      const messagesById = new Map();
      const nextMessages = prepend
        ? [...incomingMessages, ...currentMessages]
        : [...currentMessages, ...incomingMessages];

      nextMessages.forEach((message) => messagesById.set(message.id, message));

      return sortChatMessages([...messagesById.values()]);
    });
  };

  const updateUnreadPreview = async () => {
    try {
      const data = await getChatMessagesApi({ limit: unreadPreviewLimit });
      if (initializeReadMarkerIfMissing(data)) {
        return;
      }

      updateUnreadStateFromMessages(data, { preserveExisting: true });
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
      setMessages(sortChatMessages(data));
      setHasLoadedMessages(true);
      setHasOlderMessages(data.length === messageLimit);
      if (initializeReadMarkerIfMissing(data)) {
        scrollToBottom({ behavior: "auto", protectInitialLoad: true });
        return;
      }

      if (canMarkRead) {
        scheduleMarkRead(data);
      } else {
        updateUnreadStateFromMessages(data, { preserveExisting: true });
      }
      scrollToBottom({ behavior: "auto", protectInitialLoad: true });
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

    const oldestLoadedMessage = messages.find((message) => message.type !== "system" && Number.isFinite(Number(message.id)));
    if (!oldestLoadedMessage) {
      return;
    }

    const messagesList = messagesListRef.current;
    const anchorElement = messagesList?.querySelector(`[data-chat-message-id="${oldestLoadedMessage.id}"]`);
    const anchorTop = anchorElement && messagesList
      ? anchorElement.getBoundingClientRect().top - messagesList.getBoundingClientRect().top
      : 0;

    previousMessagesAnchorRef.current = {
      id: oldestLoadedMessage.id,
      top: anchorTop,
    };
    setIsLoadingOlder(true);
    setError("");

    try {
      const data = await getChatMessagesApi({
        limit: messageLimit,
        beforeId: oldestLoadedMessage.id,
      });
      mergeMessages(data, { prepend: true });
      setHasOlderMessages(data.length === messageLimit);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load older messages");
    } finally {
      setIsLoadingOlder(false);
    }
  };

  const handleMessagesScroll = (event) => {
    if (
      event.currentTarget.scrollTop <= 48
      && hasLoadedMessages
      && hasOlderMessages
      && !isOpeningMessagesRef.current
      && !isLoadingOlder
      && !isLoading
    ) {
      loadOlderMessages();
    }
  };

  useLayoutEffect(() => {
    if (!previousMessagesAnchorRef.current) {
      return;
    }

    const anchor = previousMessagesAnchorRef.current;
    const messagesList = messagesListRef.current;
    const anchorElement = messagesList?.querySelector(`[data-chat-message-id="${anchor.id}"]`);
    previousMessagesAnchorRef.current = null;

    if (!messagesList || !anchorElement) {
      return;
    }

    const currentTop = anchorElement.getBoundingClientRect().top - messagesList.getBoundingClientRect().top;
    messagesList.scrollTop += currentTop - anchor.top;
  }, [messages]);

  useLayoutEffect(() => {
    if (!activeSearchMatchId) {
      return;
    }

    const activeElement = messagesListRef.current?.querySelector(`[data-chat-message-id="${activeSearchMatchId}"]`);
    activeElement?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeSearchMatchId, messages.length]);

  useEffect(() => {
    if (!normalizedSearchTerm || searchMatchIds.length === 0) {
      setActiveSearchIndex(-1);
      return;
    }

    setActiveSearchIndex((currentIndex) => (
      currentIndex >= 0 && currentIndex < searchMatchIds.length ? currentIndex : 0
    ));
  }, [normalizedSearchTerm, searchMatchIds.length]);

  useEffect(() => {
    if (!normalizedSearchTerm) {
      searchRequestIdRef.current += 1;
      setSearchedMessageIds([]);
      setIsSearchingMessages(false);
      return undefined;
    }

    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;

    const searchTimer = window.setTimeout(async () => {
      setIsSearchingMessages(true);

      try {
        const results = await searchChatMessagesApi({ query: normalizedSearchTerm, limit: 100 });
        if (searchRequestIdRef.current !== requestId) {
          return;
        }
        setSearchedMessageIds(results.map((message) => String(message.id)));
        mergeMessages(results);
      } catch (err) {
        if (searchRequestIdRef.current !== requestId) {
          return;
        }
        setError(err.response?.data?.detail || "Failed to search chat messages");
      } finally {
        if (searchRequestIdRef.current === requestId) {
          setIsSearchingMessages(false);
        }
      }
    }, 350);

    return () => window.clearTimeout(searchTimer);
  }, [normalizedSearchTerm]);

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
      updateUnreadStateFromMessages(messages, { preserveExisting: true });
    }
  }, [isOpen, isWindowFocused, messages, hasLoadedMessages]);

  useEffect(() => {
    if (!isOpen) {
      setHighlightReadMessageId(lastReadMessageId);
    }
  }, [isOpen, lastReadMessageId]);

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

  const handleSearchNavigation = (direction) => {
    if (searchMatchIds.length === 0) {
      return;
    }

    setActiveSearchIndex((currentIndex) => {
      const safeIndex = currentIndex < 0 ? 0 : currentIndex;
      return (safeIndex + direction + searchMatchIds.length) % searchMatchIds.length;
    });
  };

  const highlightSearchText = (text) => {
    if (!normalizedSearchTerm || !text) {
      return text;
    }

    const lowerText = text.toLowerCase();
    const parts = [];
    let cursor = 0;
    let matchIndex = lowerText.indexOf(normalizedSearchTerm, cursor);

    while (matchIndex !== -1) {
      if (matchIndex > cursor) {
        parts.push(text.slice(cursor, matchIndex));
      }

      const matchEnd = matchIndex + normalizedSearchTerm.length;
      parts.push(
        <mark className="chat-search-mark" key={`${matchIndex}-${matchEnd}`}>
          {text.slice(matchIndex, matchEnd)}
        </mark>,
      );
      cursor = matchEnd;
      matchIndex = lowerText.indexOf(normalizedSearchTerm, cursor);
    }

    if (cursor < text.length) {
      parts.push(text.slice(cursor));
    }

    return parts;
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
            onClick={() => scheduleMarkRead(messages)}
            onFocusCapture={() => scheduleMarkRead(messages)}
          >
            <div className="chat-panel-header">
              <div>
                <h5 className="mb-0">Warlords Chat</h5>
                <p className="small mb-0 text-muted">
                  {onlineMemberCount} {onlineMemberCount === 1 ? "member" : "members"} online
                </p>
              </div>
              <div className="chat-search" role="search">
                <div className="input-group input-group-sm">
                  <span className="input-group-text">
                    <i className="bi bi-search" aria-hidden="true"></i>
                  </span>
                  <input
                    type="search"
                    className="form-control"
                    placeholder="Search messages"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => handleSearchNavigation(-1)}
                    disabled={searchMatchIds.length === 0}
                    aria-label="Previous matched message"
                  >
                    <i className="bi bi-chevron-up" aria-hidden="true"></i>
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => handleSearchNavigation(1)}
                    disabled={searchMatchIds.length === 0}
                    aria-label="Next matched message"
                  >
                    <i className="bi bi-chevron-down" aria-hidden="true"></i>
                  </button>
                </div>
                {normalizedSearchTerm && (
                  <span className="chat-search-count">
                    {isSearchingMessages
                      ? "Searching..."
                      : searchMatchIds.length > 0
                        ? `${activeSearchIndex + 1} of ${searchMatchIds.length}`
                        : "No results"}
                  </span>
                )}
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

          <div className="chat-messages" ref={messagesListRef} onScroll={handleMessagesScroll}>
            <div className={`chat-previous-loader ${isLoadingOlder ? "show" : ""}`} role="status" aria-live="polite">
              <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
              <span>Loading previous messages...</span>
            </div>

            {isLoading ? (
              <p className="small text-muted text-center mb-0 py-4">Loading messages...</p>
            ) : messages.length === 0 ? (
              <p className="small text-muted text-center mb-0 py-4">No chat messages yet.</p>
            ) : (
              messages.map((message) => {
                if (message.type === "system") {
                  const messageId = String(message.id);
                  const isSearchMatch = searchMatchIds.includes(messageId);
                  const isActiveSearchMatch = activeSearchMatchId === messageId;

                  return (
                    <div
                      className={`chat-system-message ${isSearchMatch ? "search-match" : ""} ${isActiveSearchMatch ? "active-search-match" : ""}`}
                      key={message.id}
                      data-chat-message-id={message.id}
                    >
                      <span>{highlightSearchText(message.message)}</span>
                      <time>{formatMessageTime(message.created_at)}</time>
                    </div>
                  );
                }

                const messageId = String(message.id);
                const isMine = message.user?.id === currentUser?.id;
                const isUnread = !isMine && message.id > highlightReadMessageId;
                const isSearchMatch = searchMatchIds.includes(messageId);
                const isActiveSearchMatch = activeSearchMatchId === messageId;
                const displayName = message.user?.full_name || message.user?.email || "Unknown user";
                const avatarUrl = getAvatarUrl(message.user?.avatar_url);
                const isEditing = editingMessageId === message.id;
                const isUnsent = Boolean(message.is_unsent);
                const unsentText = isMine ? "You unsent a message" : `${displayName} unsent a message`;

                return (
                  <article
                    className={`chat-message ${isMine ? "mine" : ""} ${isUnread ? "unread" : ""} ${isUnsent ? "unsent" : ""} ${isSearchMatch ? "search-match" : ""} ${isActiveSearchMatch ? "active-search-match" : ""}`}
                    key={message.id}
                    data-chat-message-id={message.id}
                  >
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
                          <p>{highlightSearchText(message.message)}</p>
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
