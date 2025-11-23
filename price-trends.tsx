"use client";

import React, { useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import {
  getFirestore,
  collection,
  query as q,
  orderBy,
  getDocs,
  limit as limitFn,
} from "firebase/firestore";

declare const __app_id: string | undefined;

// Improved appId initialization for robustness
const appId =
  (typeof __app_id !== "undefined" && !!__app_id)
    ? __app_id
    : (typeof window !== "undefined" && !!(window as any).__app_id)
      ? (window as any).__app_id
      : "default-app-id";

// Firebase config parsing
const rawConfig =
  typeof window !== "undefined"
    ? (window as any).__firebase_config ?? (process.env.NEXT_PUBLIC_FIREBASE_CONFIG as any)
    : (process.env.NEXT_PUBLIC_FIREBASE_CONFIG as any);

let firebaseConfig: Record<string, any> = {};
if (rawConfig) {
  try {
    firebaseConfig = typeof rawConfig === "string" ? JSON.parse(rawConfig) : rawConfig;
  } catch (e) {
    console.error("Failed to parse firebase config:", e);
    firebaseConfig = {};
  }
}

const hasFirebaseConfig = !!firebaseConfig && !!firebaseConfig.apiKey;

let db: ReturnType<typeof getFirestore> | undefined;
let auth: ReturnType<typeof getAuth> | undefined;

if (hasFirebaseConfig) {
  try {
    if (getApps().length === 0) initializeApp(firebaseConfig);
    auth = getAuth();
    db = getFirestore();
  } catch (e) {
    console.error("Firebase init error:", e);
    auth = undefined;
    db = undefined;
  }
}

function median(numbers: number[]): number {
  if (!numbers.length) return 0;
  const sorted = numbers.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

// More robust similarity and sold checks
function isCategorySimilar(categories: any, search: string): boolean {
  if (!categories || !search) return false;
  const term = search.trim().toLowerCase();
  if (Array.isArray(categories)) {
    return categories.some(cat =>
      typeof cat === "string" && cat.toLowerCase().includes(term)
    );
  }
  if (typeof categories === "string") {
    return categories.toLowerCase().includes(term);
  }
  return false;
}

function isSold(item: any): boolean {
  // Check both field variants, supporting boolean or string 'sold'
  return item.sold === true ||
    (typeof item.status === "string" && item.status.toLowerCase() === "sold");
}

export default function PriceTrends({ category }: { category: string }) {
  const [medianPrice, setMedianPrice] = useState<number>(0);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!category || category.trim().length === 0) {
      setMedianPrice(0);
      setCount(0);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        try {
          if (auth) await signInAnonymously(auth);
        } catch (e) {
          // ignore anonymous sign-in errors
        }

        if (!db) {
          if (!cancelled) {
            setMedianPrice(0);
            setCount(0);
          }
          return;
        }

        const itemsRef = collection(db, "artifacts", appId, "public", "data", "items");
        // fetch many and filter client-side
        const qRef = q(itemsRef, orderBy("price", "asc"), limitFn(200));
        const snap = await getDocs(qRef);
        const fetched = snap.docs.map((d) => d.data());
        const filtered = fetched.filter(
          (item) =>
            isCategorySimilar(item.categories, category) &&
            isSold(item)
        );
        const priceArray = filtered
          .map((item) => Number(item.price) || 0)
          .filter((x) => x > 0);

        if (!cancelled) {
          setMedianPrice(median(priceArray));
          setCount(priceArray.length);
        }
      } catch (err) {
        console.error("PriceTrends fetch failed", err);
        if (!cancelled) {
          setMedianPrice(0);
          setCount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [category]);

  if (!category) return null;

  return (
    <div className="w-full py-6">
      <div className="max-w-5xl mx-auto bg-white p-4 rounded shadow">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Median Price (sold, similar categories): {category}</h3>
          <div className="text-sm text-gray-500">
            {loading ? "Loading…" : `${count} prices`}
          </div>
        </div>
        {count === 0 ? (
          <div className="text-sm text-gray-500">
            No sold price data found for similar categories.
          </div>
        ) : (
          <div className="text-xl font-bold text-cyan-700">
            ${medianPrice.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
}
