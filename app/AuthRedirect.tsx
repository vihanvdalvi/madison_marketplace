"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "./context/UserContext";

export default function AuthRedirect() {
  const { userEmail, setUserEmail } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Avoid redirect loop when already on /login
    if (typeof window === "undefined" || window.location.pathname === "/login")
      return;

    // If context has no user, try to restore from localStorage before redirecting
    if (userEmail === null) {
      try {
        const stored = localStorage.getItem("mm_user_email");
        if (stored) {
          setUserEmail(stored);
          return; // restored, no redirect
        }
      } catch (e) {
        // ignore storage errors
      }

      // nothing to restore — redirect to login
      router.replace("/login");
    }
  }, [userEmail, setUserEmail, router]);

  return null;
}
