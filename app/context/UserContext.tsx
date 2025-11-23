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
  const [userEmail, setUserEmailState] = useState<string | null>(null);

  // Hydrate from localStorage on mount so the value persists across navigations
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("mm_user_email");
      if (stored) setUserEmailState(stored);
    } catch (e) {
      // ignore (e.g., SSR or blocked storage)
    }
  }, []);

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
