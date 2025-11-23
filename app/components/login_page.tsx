"use client";
import React, { useState } from "react";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "create">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
  };

  const validateEmail = (e: string) => /\S+@\S+\.\S+/.test(e);

  const onSubmitLogin = async (ev?: React.FormEvent) => {
    ev?.preventDefault();
    setError(null);

    if (!validateEmail(email)) return setError("Please enter a valid email.");
    if (!password) return setError("Please enter your password.");

    setLoading(true);
    try {
      // Replace with real API call when available
      console.log("Login payload", { email, password });
      // Example: await fetch('/api/login', { method: 'POST', body: JSON.stringify({ email, password }) })
      // For now just simulate success
      await new Promise((r) => setTimeout(r, 600));
      resetForm();
      alert("Logged in (mock)");
    } catch (err) {
      setError("Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmitCreate = async (ev?: React.FormEvent) => {
    ev?.preventDefault();
    setError(null);

    if (!validateEmail(email)) return setError("Please enter a valid email.");
    if (!password) return setError("Please enter a password.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    setLoading(true);
    try {
      console.log("Create account payload", { email, password });
      // Example: await fetch('/api/create-account', ...)
      await new Promise((r) => setTimeout(r, 800));
      resetForm();
      alert("Account created (mock)");
    } catch (err) {
      setError("Failed to create account. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Welcome</h2>

        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => { setMode("login"); setError(null); }}
            className={`flex-1 py-2 rounded-lg font-medium ${mode === "login" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            Login
          </button>
          <button
            onClick={() => { setMode("create"); setError(null); }}
            className={`flex-1 py-2 rounded-lg font-medium ${mode === "create" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-100 p-2 rounded mb-4">{error}</div>
        )}

        {mode === "login" ? (
          <form onSubmit={onSubmitLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-200 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-200 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Your password"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={onSubmitCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-200 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-200 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Choose a password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Re-type password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-200 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Re-type password"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create account"}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
