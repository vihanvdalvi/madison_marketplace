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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
          {mode === "login" ? "Badger Login" : "Join the Market"}
        </h2>

        {/* Toggle Buttons */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              mode === "login"
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setMode("create");
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              mode === "create"
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-100 p-3 rounded mb-4">
            ⚠️ {error}
          </div>
        )}

        {/* Login Form */}
        {mode === "login" ? (
          <form onSubmit={onSubmitLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                NetID Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="badger@wisc.edu"
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
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-md bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
            >
              {loading ? "Verifying..." : "Sign In"}
            </button>
          </form>
        ) : (
          /* Create Account Form */
          <form onSubmit={onSubmitCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                NetID Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="badger@wisc.edu"
              />
              <p className="text-xs text-gray-500 mt-1">
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
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Create strong password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Repeat password"
              />
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-600 mt-1">
                  Passwords do not match.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={
                loading || !password || !confirmPassword || !passwordsMatch
              }
              className="w-full py-2 rounded-md bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
