"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "./context/UserContext";

export default function Home() {
  const { userEmail } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Redirect based on whether a user is present in context
    if (userEmail) router.replace("/browse");
    else router.replace("/login");
  }, [userEmail, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#EDE8D0] via-white to-[#F6F1E6] font-sans">
      <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-white/30 animate-pulse">
        <p className="text-gray-700">Checking session…</p>
      </div>
    </div>
  );
}
