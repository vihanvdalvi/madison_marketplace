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
    <div className="flex min-h-screen items-center justify-center bg-[#EDE8D0] font-sans">
      <p className="text-gray-600">Redirecting…</p>
    </div>
  );
}
