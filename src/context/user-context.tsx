import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUserId } from "@/lib/backend-api";

interface User {
  id: string;
  email: string;
  name: string;
  officeLocation: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
  };
}

interface UserContextType {
  user: User;
}

const DEFAULT_OFFICE_LOCATION = {
  latitude: 40.7128, // Example: New York
  longitude: -74.006,
  radiusMeters: 100,
};

function readProfile() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem("simpleflow_profile");
    if (!raw) return null;
    return JSON.parse(raw) as { firstName?: string; lastName?: string; email?: string };
  } catch {
    return null;
  }
}

function resolveUser(): User {
  const id = getCurrentUserId();
  const profile = readProfile();
  const email = profile?.email?.trim() || "unknown@local";
  const name =
    `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() ||
    email.split("@")[0] ||
    "Unknown";

  return {
    id,
    email,
    name,
    officeLocation: DEFAULT_OFFICE_LOCATION,
  };
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(() => resolveUser());

  useEffect(() => {
    const refresh = () => setUser(resolveUser());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("simpleflow:auth:changed", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("simpleflow:auth:changed", refresh);
    };
  }, []);

  const value = useMemo(() => ({ user }), [user]);

  return (
    <UserContext.Provider value={value}>{children}</UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}
