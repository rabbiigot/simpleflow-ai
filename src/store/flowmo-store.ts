import { useSyncExternalStore } from "react";
import type { AiChatResponse } from "@/lib/backend-api";

export type ChatMessage =
  | {
      id: string;
      role: "user";
      type: "text";
      text: string;
      imagePreview?: string;
      documentFile?: { name: string; label: string };
      createdAt: number;
    }
  | {
      id: string;
      role: "assistant";
      type: "text";
      text: string;
      createdAt: number;
    }
  | {
      id: string;
      role: "assistant";
      type: "response";
      response: AiChatResponse;
      createdAt: number;
    }
  | {
      id: string;
      role: "assistant";
      type: "error";
      text: string;
      createdAt: number;
    }
  | {
      id: string;
      role: "assistant";
      type: "github_event";
      eventType: string;
      action: string | null;
      title: string;
      body: string | null;
      prNumber: number | null;
      repoFullName: string;
      url: string;
      authorLogin: string;
      sha: string;
      actionCompleted?: boolean;
      createdAt: number;
    }
  | {
      id: string;
      role: "assistant";
      type: "calendar_event";
      title: string;
      time: string;
      location: string | null;
      meetLink: string | null;
      actionCompleted?: "created" | "linked";
      createdAt: number;
    };

export type SessionHistoryEntry = {
  id: string;
  title: string;
  sessionId: number | null;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
};

const CONFIRMATION_STORAGE_KEY = "simpleflow_ai_confirmation_id";
const SESSION_STORAGE_KEY = "simpleflow_ai_session_id";
const SESSION_HISTORY_KEY = "simpleflow_ai_session_history";
const ACTIVE_HISTORY_ID_KEY = "simpleflow_ai_active_history_id";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  type: "text",
  text: "Tell me what you want to do, or use Quick Actions below. I can also execute actions after you confirm.",
  createdAt: Date.now(),
};

function deriveTitle(messages: ChatMessage[]): string {
  const firstUserMsg = messages.find((m) => m.role === "user" && m.type === "text");
  if (firstUserMsg && firstUserMsg.type === "text") {
    const text = firstUserMsg.text.trim();
    return text.length > 50 ? text.slice(0, 50) + "…" : text;
  }

  // Summarize from GitHub/calendar events if no user messages
  const ghEvents = messages.filter((m) => m.type === "github_event");
  if (ghEvents.length > 0) {
    const first = ghEvents[0] as Extract<ChatMessage, { type: "github_event" }>;
    const label = `PR #${first.prNumber} ${first.action || "update"}: ${first.title}`;
    if (ghEvents.length === 1) return label.length > 50 ? label.slice(0, 50) + "…" : label;
    return `${ghEvents.length} GitHub updates`;
  }

  const calEvents = messages.filter((m) => m.type === "calendar_event");
  if (calEvents.length > 0) {
    const first = calEvents[0] as Extract<ChatMessage, { type: "calendar_event" }>;
    if (calEvents.length === 1) return first.title.length > 50 ? first.title.slice(0, 50) + "…" : first.title;
    return `${calEvents.length} Calendar events`;
  }

  return "New chat";
}

function loadSessionHistory(): SessionHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SESSION_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistSessionHistory(history: SessionHistoryEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(history));
}

function loadActiveHistoryId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_HISTORY_ID_KEY) || null;
}

function persistActiveHistoryId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) {
    localStorage.setItem(ACTIVE_HISTORY_ID_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_HISTORY_ID_KEY);
  }
}

type FlowmoState = {
  messages: ChatMessage[];
  pendingConfirmationId: string | null;
  sessionId: number | null;
  sessionHistory: SessionHistoryEntry[];
  activeHistoryId: string | null;
};

type FlowmoActions = {
  addMessage: (message: ChatMessage) => void;
  setMessages: (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  saveConfirmationId: (value: string | null) => void;
  saveSessionId: (value: number | null) => void;
  clearSession: () => void;
  startNewSession: () => void;
  loadSession: (historyId: string) => void;
  deleteSessionHistory: (historyId: string) => void;
  renameSession: (historyId: string, title: string) => void;
};

type FlowmoStore = FlowmoState & FlowmoActions;

const subscribers = new Set<() => void>();

function loadInitialState(): FlowmoState {
  let confirmationId: string | null = null;
  let sessionId: number | null = null;
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(CONFIRMATION_STORAGE_KEY);
    confirmationId = stored?.trim() ? stored.trim() : null;
    const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
    sessionId = storedSession ? Number(storedSession) : null;
  }

  const history = loadSessionHistory();
  const activeId = loadActiveHistoryId();

  // Restore messages from the active session if it exists
  let messages: ChatMessage[] = [WELCOME_MESSAGE];
  if (activeId) {
    const activeEntry = history.find((e) => e.id === activeId);
    if (activeEntry && activeEntry.messages.length > 0) {
      messages = [...activeEntry.messages];
    }
  }

  return {
    messages,
    pendingConfirmationId: confirmationId,
    sessionId,
    sessionHistory: history,
    activeHistoryId: activeId,
  };
}

let state: FlowmoState = loadInitialState();

function emit() {
  subscribers.forEach((listener) => listener());
}

/** Save the current messages into the session history (create or update). */
function saveCurrentToHistory() {
  const hasUserMessages = state.messages.some((m) => m.role === "user");
  const hasEvents = state.messages.some((m) => m.type === "github_event" || m.type === "calendar_event");
  if (!hasUserMessages && !hasEvents) return;

  const now = Date.now();
  let history = [...state.sessionHistory];

  if (state.activeHistoryId) {
    // Update existing entry
    history = history.map((entry) =>
      entry.id === state.activeHistoryId
        ? {
            ...entry,
            title: deriveTitle(state.messages),
            sessionId: state.sessionId,
            updatedAt: now,
            messages: [...state.messages],
          }
        : entry,
    );
  } else {
    // Create new entry
    const newEntry: SessionHistoryEntry = {
      id: crypto.randomUUID(),
      title: deriveTitle(state.messages),
      sessionId: state.sessionId,
      createdAt: now,
      updatedAt: now,
      messages: [...state.messages],
    };
    history = [newEntry, ...history];
    state = { ...state, activeHistoryId: newEntry.id };
    persistActiveHistoryId(newEntry.id);
  }

  // Keep max 50 sessions
  if (history.length > 50) history = history.slice(0, 50);

  state = { ...state, sessionHistory: history };
  persistSessionHistory(history);
}

const store: FlowmoStore = {
  get messages() {
    return state.messages;
  },
  get pendingConfirmationId() {
    return state.pendingConfirmationId;
  },
  get sessionId() {
    return state.sessionId;
  },
  get sessionHistory() {
    return state.sessionHistory;
  },
  get activeHistoryId() {
    return state.activeHistoryId;
  },

  addMessage(message: ChatMessage) {
    state = { ...state, messages: [...state.messages, message] };
    emit();
    // Auto-save to history after each message
    saveCurrentToHistory();
    emit();
  },

  setMessages(updater) {
    const next =
      typeof updater === "function" ? updater(state.messages) : updater;
    state = { ...state, messages: next };
    emit();
    saveCurrentToHistory();
    emit();
  },

  saveConfirmationId(value: string | null) {
    state = { ...state, pendingConfirmationId: value };
    if (typeof window !== "undefined") {
      if (value) {
        localStorage.setItem(CONFIRMATION_STORAGE_KEY, value);
      } else {
        localStorage.removeItem(CONFIRMATION_STORAGE_KEY);
      }
    }
    emit();
  },

  saveSessionId(value: number | null) {
    state = { ...state, sessionId: value };
    if (typeof window !== "undefined") {
      if (value != null) {
        localStorage.setItem(SESSION_STORAGE_KEY, String(value));
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
    emit();
  },

  clearSession() {
    state = {
      ...state,
      messages: [{ ...WELCOME_MESSAGE, createdAt: Date.now() }],
      pendingConfirmationId: null,
      sessionId: null,
      activeHistoryId: null,
    };
    if (typeof window !== "undefined") {
      localStorage.removeItem(CONFIRMATION_STORAGE_KEY);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    persistActiveHistoryId(null);
    emit();
  },

  startNewSession() {
    // Save current conversation first if it has user messages
    saveCurrentToHistory();

    // Reset to fresh state
    state = {
      ...state,
      messages: [{ ...WELCOME_MESSAGE, createdAt: Date.now() }],
      pendingConfirmationId: null,
      sessionId: null,
      activeHistoryId: null,
    };
    if (typeof window !== "undefined") {
      localStorage.removeItem(CONFIRMATION_STORAGE_KEY);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    persistActiveHistoryId(null);
    emit();
  },

  loadSession(historyId: string) {
    // Save current conversation first
    saveCurrentToHistory();

    const entry = state.sessionHistory.find((e) => e.id === historyId);
    if (!entry) return;

    state = {
      ...state,
      messages: [...entry.messages],
      sessionId: entry.sessionId,
      pendingConfirmationId: null,
      activeHistoryId: entry.id,
    };

    if (typeof window !== "undefined") {
      localStorage.removeItem(CONFIRMATION_STORAGE_KEY);
      if (entry.sessionId != null) {
        localStorage.setItem(SESSION_STORAGE_KEY, String(entry.sessionId));
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
    persistActiveHistoryId(entry.id);
    emit();
  },

  deleteSessionHistory(historyId: string) {
    const history = state.sessionHistory.filter((e) => e.id !== historyId);
    state = {
      ...state,
      sessionHistory: history,
      // If we deleted the active session, clear it
      activeHistoryId: state.activeHistoryId === historyId ? null : state.activeHistoryId,
    };
    persistSessionHistory(history);
    if (state.activeHistoryId === null && historyId) {
      persistActiveHistoryId(null);
    }
    emit();
  },

  renameSession(historyId: string, title: string) {
    const history = state.sessionHistory.map((e) =>
      e.id === historyId ? { ...e, title } : e,
    );
    state = { ...state, sessionHistory: history };
    persistSessionHistory(history);
    emit();
  },
};

function subscribe(listener: () => void) {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

function getSnapshot() {
  return store;
}

export function useFlowmoStore<T>(selector: (store: FlowmoStore) => T) {
  return useSyncExternalStore(subscribe, () => selector(getSnapshot()));
}

export function flowmoStoreClearSession() {
  store.clearSession();
}
