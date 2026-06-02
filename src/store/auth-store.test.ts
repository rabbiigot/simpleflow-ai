import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the flowmo-store dependency before importing auth-store
vi.mock("./flowmo-store", () => ({
  flowmoStoreClearSession: vi.fn(),
}));

import {
  AUTH_TOKEN_KEY,
  AUTH_STORAGE_KEY,
  PROFILE_STORAGE_KEY,
  authStoreGetState,
} from "./auth-store";
import type { AuthUser } from "./auth-store";
import { flowmoStoreClearSession } from "./flowmo-store";

describe("auth-store", () => {
  beforeEach(() => {
    // Clear localStorage and reset module state
    localStorage.clear();
    vi.clearAllMocks();

    // Reset store state by calling clearAuth
    authStoreGetState().clearAuth();
  });

  describe("setAuth", () => {
    it("should set the token and user", () => {
      const user: AuthUser = {
        id: "user-1",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        role: "admin",
      };

      authStoreGetState().setAuth({ token: "test-token-123", user });

      const state = authStoreGetState();
      expect(state.token).toBe("test-token-123");
      expect(state.user).toEqual(user);
    });

    it("should persist auth state to localStorage", () => {
      const user: AuthUser = {
        id: "user-2",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
      };

      authStoreGetState().setAuth({ token: "token-abc", user });

      const storedAuth = JSON.parse(
        localStorage.getItem(AUTH_STORAGE_KEY) || "{}",
      );
      expect(storedAuth.token).toBe("token-abc");
      expect(storedAuth.user.id).toBe("user-2");

      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe("token-abc");
    });

    it("should persist profile data to localStorage", () => {
      const user: AuthUser = {
        id: "user-3",
        firstName: "Alice",
        lastName: "Wonder",
        email: "alice@example.com",
      };

      authStoreGetState().setAuth({ token: "token-xyz", user });

      const storedProfile = JSON.parse(
        localStorage.getItem(PROFILE_STORAGE_KEY) || "{}",
      );
      expect(storedProfile.firstName).toBe("Alice");
      expect(storedProfile.lastName).toBe("Wonder");
      expect(storedProfile.email).toBe("alice@example.com");
    });

    it("should dispatch simpleflow:auth:changed event", () => {
      const handler = vi.fn();
      window.addEventListener("simpleflow:auth:changed", handler);

      const user: AuthUser = { id: "user-4" };
      authStoreGetState().setAuth({ token: "tok", user });

      expect(handler).toHaveBeenCalledTimes(1);
      window.removeEventListener("simpleflow:auth:changed", handler);
    });
  });

  describe("clearAuth", () => {
    it("should reset token and user to initial values", () => {
      const user: AuthUser = { id: "user-5", email: "test@test.com" };
      authStoreGetState().setAuth({ token: "will-be-cleared", user });

      authStoreGetState().clearAuth();

      const state = authStoreGetState();
      expect(state.token).toBe("");
      expect(state.user).toBeNull();
    });

    it("should remove auth keys from localStorage", () => {
      const user: AuthUser = { id: "user-6" };
      authStoreGetState().setAuth({ token: "to-remove", user });

      authStoreGetState().clearAuth();

      expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem("simpleflow_user_id")).toBeNull();
    });

    it("should remove token from sessionStorage", () => {
      sessionStorage.setItem(AUTH_TOKEN_KEY, "session-token");

      authStoreGetState().clearAuth();

      expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    });

    it("should call flowmoStoreClearSession", () => {
      authStoreGetState().clearAuth();

      expect(flowmoStoreClearSession).toHaveBeenCalled();
    });

    it("should dispatch simpleflow:auth:changed event", () => {
      const handler = vi.fn();
      window.addEventListener("simpleflow:auth:changed", handler);

      authStoreGetState().clearAuth();

      expect(handler).toHaveBeenCalled();
      window.removeEventListener("simpleflow:auth:changed", handler);
    });
  });

  describe("selector pattern (authStoreGetState)", () => {
    it("should return a store object with token, user, setAuth, and clearAuth", () => {
      const state = authStoreGetState();

      expect(state).toHaveProperty("token");
      expect(state).toHaveProperty("user");
      expect(typeof state.setAuth).toBe("function");
      expect(typeof state.clearAuth).toBe("function");
    });

    it("should reflect the latest state after mutations", () => {
      const user: AuthUser = {
        id: "user-7",
        firstName: "Bob",
        lastName: "Builder",
        email: "bob@example.com",
        role: "viewer",
      };

      authStoreGetState().setAuth({ token: "latest-token", user });

      const stateAfterSet = authStoreGetState();
      expect(stateAfterSet.token).toBe("latest-token");
      expect(stateAfterSet.user?.firstName).toBe("Bob");

      authStoreGetState().clearAuth();

      const stateAfterClear = authStoreGetState();
      expect(stateAfterClear.token).toBe("");
      expect(stateAfterClear.user).toBeNull();
    });
  });
});
