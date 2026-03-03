"use client";

import React, { createContext, useContext } from "react";

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

const mockUser: User = {
  id: "user-001",
  email: "john.doe@company.com",
  name: "John Doe",
  officeLocation: {
    latitude: 40.7128, // Example: New York
    longitude: -74.006,
    radiusMeters: 100, // 100 meters radius for office
  },
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  return (
    <UserContext.Provider value={{ user: mockUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}
