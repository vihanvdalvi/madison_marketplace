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

// Read firebase config injected at runtime (prefer global set on window, else env)
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
const appId = typeof __app_id !== "undefined" ? (__app_id as string) : (typeof window !== "undefined" ? (window as any).__app_id ?? "default-app-id" : "default-app-id");

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

type Point = { t: number; p: number };

export default function PriceTrends({ category }: { category: string }) {
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!category || category.trim().length === 0) {
      setPoints([]);
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
          if (!cancelled) setPoints([]);
          return;
        }

        const itemsRef = collection(db, "artifacts", appId, "public", "data", "items");
        // find items where caption or category contains the provided string
        // Firestore can't do contains substring queries; we query a set and filter client-side
        const qRef = q(itemsRef, orderBy("createdAt", "asc"), limitFn(200));
        const snap = await getDocs(qRef);
        const fetched = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
          .filter((it) => {
            const caption = (it.caption || "").toString().toLowerCase();
            const cat = (it.category || it.main_category || "").toString().toLowerCase();
            const term = category.toLowerCase();
            return caption.includes(term) || cat.includes(term);
          })
          .map((it) => {
            // normalize createdAt
            let t = Date.now();
            if (it.createdAt && typeof it.createdAt.toDate === "function") {
              t = it.createdAt.toDate().getTime();
            } else if (it.createdAt) {
              t = new Date(it.createdAt).getTime();
            }
            const p = Number(it.price) || 0;
            return { t, p };
          });

        if (!cancelled) setPoints(fetched);
      } catch (err) {
        console.error("PriceTrends fetch failed", err);
        if (!cancelled) setPoints([]);
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

  // Simple SVG line chart
  const width = 800;
  const height = 180;
  const padding = 32;

  const xs = points.map((pt) => pt.t);
  const ys = points.map((pt) => pt.p);

  const minX = xs.length ? Math.min(...xs) : 0;
  const maxX = xs.length ? Math.max(...xs) : Date.now();
  const minY = ys.length ? Math.min(...ys) : 0;
  const maxY = ys.length ? Math.max(...ys) : 1;

  const xScale = (t: number) => {
    if (maxX === minX) return padding + (width - 2 * padding) / 2;
    return (
      padding + ((t - minX) / (maxX - minX)) * (width - 2 * padding)
    );
  };
  const yScale = (p: number) => {
    if (maxY === minY) return height - padding;
    return (
      height - padding - ((p - minY) / (maxY - minY)) * (height - 2 * padding)
    );
  };

  const pointsStr = points.map((pt) => `${xScale(pt.t)},${yScale(pt.p)}`).join(" ");

  return (
    <div className="w-full overflow-x-auto py-6">
      <div className="max-w-5xl mx-auto bg-white p-4 rounded shadow">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Price Trend: {category}</h3>
          <div className="text-sm text-gray-500">{loading ? "Loading…" : `${points.length} points`}</div>
        </div>
        {points.length === 0 ? (
          <div className="text-sm text-gray-500">No historical price data found for this category.</div>
        ) : (
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {/* axes */}
            <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#e5e7eb" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e5e7eb" />
            {/* polyline */}
            <polyline fill="none" stroke="#C41E3A" strokeWidth={2} points={pointsStr} />
            {/* circles */}
            {points.map((pt, i) => (
              <circle key={i} cx={xScale(pt.t)} cy={yScale(pt.p)} r={3} fill="#C41E3A" />
            ))}
          </svg>
        )}
      </div>
    </div>
  );
}
