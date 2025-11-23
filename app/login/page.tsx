"use client";
import { useUser } from "../context/UserContext";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createAccount, login } from "../../hashing";
// Firebase Functions imports removed because this component currently uses mocked backend calls.
// If you enable real backend calls later, install the Firebase SDK and re-add:
// import { getFunctions, httpsCallable } from "firebase/functions";
// import { getApp } from "firebase/app";

// --- REGEX CONSTANTS ---
// Enforce @wisc.edu email address
const WISCONSIN_EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@wisc\.edu$/;

// Enforce Strong Password:
// - At least 12 characters ({12,})
// - At least one Uppercase (?=.*[A-Z])
// - At least one Digit (?=.*\d)
// - At least one Special Character (?=.*[!@#$%^&*])
const STRONG_PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])(?=.{12,})/;

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "create">("login");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { setUserEmail } = useUser();

  // Initialize Firebase Functions (Assumes Firebase is initialized in your app)
  // const functions = getFunctions(getApp());

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
  };

  const validateEmail = (e: string) => WISCONSIN_EMAIL_REGEX.test(e);
  const validatePasswordStrength = (p: string) => STRONG_PASSWORD_REGEX.test(p);
  const passwordsMatch = password === confirmPassword;

  const onSubmitLogin = async (ev?: React.FormEvent) => {
    ev?.preventDefault();
    setError(null);

    if (!validateEmail(email))
      return setError("Please enter a valid @wisc.edu email.");
    if (!password) return setError("Please enter your password.");

    setLoading(true);
    try {
      console.log("Attempting login for:", email);
      const normalized = email.trim().toLowerCase();
      // start login and clear sensitive state ASAP
      const loginPromise = login(normalized, password);
      setPassword("");
      await loginPromise;
      // set user email in context for use in upload page
      setUserEmail(normalized);
      // Redirect to upload page after successful login
      resetForm();
      router.push("/browse");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmitCreate = async (ev?: React.FormEvent) => {
    ev?.preventDefault();
    setError(null);

    // 1. Validation Checks
    if (!validateEmail(email)) {
      return setError("You must use a @wisc.edu email address to register.");
    }
    if (!validatePasswordStrength(password)) {
      return setError(
        "Password must be 12+ chars, with 1 Uppercase, 1 Number, and 1 Special Char."
      );
    }
    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    setLoading(true);
    try {
      console.log("Creating account for:", email);
      const normalized = email.trim().toLowerCase();
      // start account creation and clear sensitive state ASAP
      const createPromise = createAccount(normalized, password);
      setPassword("");
      setConfirmPassword("");
      await createPromise;
      alert("Account created successfully! Please log in.");
      setMode("login");
      resetForm();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center bg-[#EDE8D0] p-6 pt-24">
      <div className="w-full max-w-md bg-white/60 backdrop-blur-md rounded-3xl shadow-lg border border-white/20 p-8">
        <h2 className="text-3xl font-semibold text-gray-800 mb-4 text-center">
          Badger Login
        </h2>

        {/* Segmented Toggle with sliding indicator */}
        <div className="relative mb-6 p-1 rounded-full bg-white/10">
          {/* sliding pill */}
          <div
            className={
              "absolute inset-y-1 left-1 w-1/2 rounded-full bg-red-600 shadow-md transform transition-transform duration-500 ease-in-out " +
              (mode === "create" ? "translate-x-full" : "translate-x-0")
            }
            aria-hidden
          />

          <div className="relative flex">
            <button
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`w-1/2 py-2 rounded-full font-medium relative z-10 transition-colors text-sm ${
                mode === "login"
                  ? "text-white"
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              Login
            </button>

            <button
              onClick={() => {
                setMode("create");
                setError(null);
              }}
              className={`w-1/2 py-2 rounded-full font-medium relative z-10 transition-colors text-sm ${
                mode === "create"
                  ? "text-white"
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-100 p-3 rounded mb-4">
            ⚠️ {error}
          </div>
        )}

        {/* Login Form */}
        {mode === "login" ? (
          <form onSubmit={onSubmitLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                NetID Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 block w-full rounded-xl bg-white/40 backdrop-blur-sm border border-white/20 px-4 py-3 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="badger@wisc.edu"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 block w-full rounded-xl bg-white/40 backdrop-blur-sm border border-white/20 px-4 py-3 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold shadow-md hover:shadow-lg transform-gpu hover:-translate-y-0.5 disabled:opacity-60 transition-all"
            >
              {loading ? "Verifying..." : "Sign In"}
            </button>
          </form>
        ) : (
          /* Create Account Form */
          <form onSubmit={onSubmitCreate} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                NetID Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 block w-full rounded-xl bg-white/40 backdrop-blur-sm border border-white/20 px-4 py-3 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="badger@wisc.edu"
                autoComplete="username"
              />
              <p className="text-xs text-gray-500 mt-2">
                Must be a valid @wisc.edu address
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 block w-full rounded-xl bg-white/40 backdrop-blur-sm border border-white/20 px-4 py-3 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Create strong password"
                autoComplete="new-password"
              />
              <p className="text-xs text-gray-500 mt-2">
                Passwords should be 12+ characters, include an uppercase letter,
                a number, and a special character.
              </p>
            </div>

            {/* Collapsible confirm-password area (safe, isolated change) */}
            <div
              className="overflow-hidden"
              style={{
                maxHeight: mode === "create" ? 220 : 0,
                transition: "max-height 600ms ease",
              }}
            >
              <div className="pt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-2 block w-full rounded-xl bg-white/40 backdrop-blur-sm border border-white/20 px-4 py-3 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Repeat password"
                  autoComplete="new-password"
                />
                {confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-red-600 mt-2">
                    Passwords do not match.
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={
                loading || !password || !confirmPassword || !passwordsMatch
              }
              className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold shadow-md hover:shadow-lg transform-gpu hover:-translate-y-0.5 disabled:opacity-60 transition-all"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
