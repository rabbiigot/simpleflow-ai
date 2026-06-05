import { useSyncExternalStore } from "react";
import { flowmoStoreClearSession } from "./flowmo-store";

export const AUTH_TOKEN_KEY = "simpleflow_token";
export const AUTH_STORAGE_KEY = "simpleflow_auth_state";
export const PROFILE_STORAGE_KEY = "simpleflow_profile";

export type AuthUser = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  featureFlags?: Record<string, boolean> | null;
};

type AuthState = {
  token: string;
  user: AuthUser | null;
};

type AuthActions = {
  setAuth: (payload: { token: string; user: AuthUser }) => void;
  clearAuth: () => void;
};

type AuthStore = AuthState & AuthActions;

const subscribers = new Set<() => void>();

function loadInitialState(): AuthState {
  if (typeof window === "undefined") {
    return { token: "", user: null };
  }

  const fromLocalToken = localStorage.getItem(AUTH_TOKEN_KEY) || "";

  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return {
        token: fromLocalToken,
        user: null,
      };
    }

    const parsed = JSON.parse(raw) as AuthState;
    return {
      token: parsed.token || fromLocalToken,
      user: parsed.user || null,
    };
  } catch {
    return {
      token: fromLocalToken,
      user: null,
    };
  }
}

let state: AuthState = loadInitialState();

function persistState() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));

  if (state.token) {
    localStorage.setItem(AUTH_TOKEN_KEY, state.token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }

  if (state.user) {
    let existingProfile: Record<string, string> = {};
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, string>;
        // Only merge if it belongs to the same user
        if (parsed.email === state.user.email) {
          existingProfile = parsed;
        }
      }
    } catch {
      existingProfile = {};
    }

    localStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify({
        ...existingProfile,
        firstName: state.user.firstName || "",
        lastName: state.user.lastName || "",
        email: state.user.email || "",
      }),
    );
  }

  // Let non-store consumers (like context providers) react immediately in the same tab.
  window.dispatchEvent(new Event("simpleflow:auth:changed"));
}

function emit() {
  subscribers.forEach((listener) => listener());
}

const store: AuthStore = {
  get token() {
    return state.token;
  },
  get user() {
    return state.user;
  },
  setAuth(payload) {
    state = {
      token: payload.token,
      user: payload.user,
    };
    persistState();
    emit();
  },
  clearAuth() {
    state = {
      token: "",
      user: null,
    };

    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      localStorage.removeItem("simpleflow_user_id");
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
      window.dispatchEvent(new Event("simpleflow:auth:changed"));
    }

    flowmoStoreClearSession();
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

export function useAuthStore<T>(selector: (store: AuthStore) => T) {
  return useSyncExternalStore(subscribe, () => selector(getSnapshot()));
}

export function authStoreGetState() {
  return getSnapshot();
}
