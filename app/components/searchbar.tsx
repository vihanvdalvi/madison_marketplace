"use client";

import React, { useState, useEffect, useRef } from "react";
import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, collection, getDocs, Firestore } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged, Auth } from "firebase/auth";

// Firebase client config
const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";

// -------------------- Firebase init (safe, single source) --------------------
// Prefer runtime global __firebase_config (used elsewhere in the project) and fallback to NEXT_PUBLIC_FIREBASE_CONFIG
const rawConfig =
  typeof window !== "undefined"
    ? // runtime: prefer global set before render
      (window as any).__firebase_config ?? (process.env.NEXT_PUBLIC_FIREBASE_CONFIG as any)
    : (process.env.NEXT_PUBLIC_FIREBASE_CONFIG as any);

let firebaseConfig: Record<string, any> = {};
if (rawConfig) {
  try {
    firebaseConfig = typeof rawConfig === "string" ? JSON.parse(rawConfig) : rawConfig;
  } catch (e) {
    // invalid JSON or unexpected shape - keep firebaseConfig empty
    // eslint-disable-next-line no-console
    console.error("Failed to parse firebase config:", e);
    firebaseConfig = {};
  }
}

const hasFirebaseConfig = !!firebaseConfig && !!firebaseConfig.apiKey;

// Keep references optional to avoid using Firebase when not configured
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (hasFirebaseConfig) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    // initialization failed — leave as undefined and log for debugging
    // eslint-disable-next-line no-console
    console.error("Firebase init error:", e);
    app = undefined;
    auth = undefined;
    db = undefined;
  }
}
// -------------------- end Firebase init --------------------

interface Item {
  id: string;
  title?: string;
  category?: string;
  price?: number;
  status?: "available" | "sold";
}

// Reusable ItemCard component
const ItemCard = ({ item }: { item: Item }) => (
  <div className="border p-4 rounded-lg shadow-sm bg-white hover:shadow-md transition">
    <div className="flex justify-between items-center mb-2">
      <span className="bg-gray-100 text-xs px-2 py-1 rounded uppercase font-bold text-gray-600">
        {item.category}
      </span>
      <span className="text-green-700 font-bold">${item.price}</span>
    </div>
    <h3 className="text-lg font-semibold">{item.title}</h3>
    <p className="text-sm text-gray-500">Status: {item.status}</p>
  </div>
);

export default function MarketplaceSearch() {
  const [user, setUser] = useState<any>(null);
  const [matchedItems, setMatchedItems] = useState<Item[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number | undefined>(undefined);

  // sign in anonymously if auth present
  useEffect(() => {
    if (!auth) {
      // keep quiet in UI; devs can see console
      // eslint-disable-next-line no-console
      if (!hasFirebaseConfig) console.warn("Firebase not configured; search will be disabled.");
      return;
    }
    signInAnonymously(auth);
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  // perform search on debounced input; if input empty => clear results
  useEffect(() => {
    // clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // no results shown for empty input per request
    if (!searchText || searchText.trim() === "") {
      setMatchedItems([]);
      setLoading(false);
      return;
    }

    // debounce 300ms
    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      const term = searchText.toLowerCase().trim();

      if (!db) {
        // eslint-disable-next-line no-console
        console.warn("Firestore DB not available; cannot perform search.");
        setMatchedItems([]);
        setLoading(false);
        return;
      }

      try {
        const itemsRef = collection(
          db,
          "artifacts",
          typeof __app_id !== "undefined" ? __app_id : appId,
          "public",
          "data",
          "items"
        );

        // fetch once and filter client-side for "contains" semantics
        const snap = await getDocs(itemsRef);
        const results: Item[] = [];
        snap.forEach((doc) => {
          const data = doc.data() as Record<string, any>;
          const category = (data.category || "").toString().toLowerCase();
          if (category.includes(term)) {
            results.push({
              id: doc.id,
              title: data.title,
              category: data.category,
              price: data.price,
              status: data.status,
            });
          }
        });

        setMatchedItems(results);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Search error:", err);
        setMatchedItems([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchText]);

  // UI: always show an empty search input at start; nothing else until user types
  return (
    <div className="p-8 max-w-4xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-4">Marketplace</h1>

      <input
        type="text"
        placeholder="Type category keyword and press Enter or wait..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className="w-full p-3 border rounded-lg text-lg focus:ring-2 focus:ring-blue-500 outline-none mb-6"
      />

      {/* Results area: empty until searchText provided */}
      {loading ? (
        <p className="text-gray-500">Searching...</p>
      ) : searchText.trim() === "" ? (
        // intentionally render nothing per request (blank)
        <div />
      ) : matchedItems.length > 0 ? (
        <div>
          <h2 className="text-lg font-medium mb-2">Matched IDs</h2>
          <ul className="mb-4 space-y-2">
            {matchedItems.map((it) => (
              <li key={it.id} className="text-sm text-gray-700">
                {it.id} {it.title ? `— ${it.title}` : ""}
              </li>
            ))}
          </ul>

          {/* optional card view */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matchedItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500 py-10">No items found</p>
      )}
    </div>
  );
}
