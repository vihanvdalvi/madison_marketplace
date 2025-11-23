"use client";

import React, { createContext, useContext, useState } from "react";

type UserContextType = {
  userEmail: string | null;
  setUserEmail: (email: string | null) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Initialize from localStorage synchronously on first client render to avoid
  // an interim null state that causes UI flicker (reads are wrapped in try/catch)
  const [userEmail, setUserEmailState] = useState<string | null>(() => {
    try {
      return localStorage.getItem("mm_user_email");
    } catch (e) {
      return null;
    }
  });

  // wrapper to update state and persist
  const setUserEmail = (email: string | null) => {
    setUserEmailState(email);
    try {
      if (email) localStorage.setItem("mm_user_email", email);
      else localStorage.removeItem("mm_user_email");
    } catch (e) {
      // ignore storage errors
    }
  };

  return (
    <UserContext.Provider value={{ userEmail, setUserEmail }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
};

export default UserContext;
