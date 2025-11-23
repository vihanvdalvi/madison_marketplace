"use client";

import React, { useState, useEffect, useRef } from "react";
import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, collection, getDocs, Firestore, query, where } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged, Auth } from "firebase/auth";
import Image from "next/image";

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
  categories?: string[] | string; // support both shapes
  price?: number;
  status?: "available" | "sold";
  sold?: boolean;
  imageUrl?: string; // new: optional product image
}

// Reusable ItemCard (matches product card style used in browse)
const ItemCard = ({ item }: { item: Item }) => (
  <div className="border p-0 rounded-lg shadow-sm bg-white hover:shadow-md transition overflow-hidden">
    <div className="relative w-full h-48 bg-gray-100">
      {item.imageUrl ? (
        <Image
          src={item.imageUrl}
          alt={item.title || "Product image"}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full text-gray-400">
          No image
        </div>
      )}
    </div>

    <div className="p-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-md font-semibold text-gray-800">{item.title || "Untitled"}</h3>
        <span className="text-sm font-bold text-green-700">${item.price ?? "—"}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs bg-gray-100 px-2 py-1 rounded uppercase font-semibold text-gray-600">
          {item.category ?? "Uncategorized"}
        </span>
        <span className={`text-xs font-medium ${item.sold ? "text-red-600" : "text-gray-500"}`}>
          {item.sold ? "Sold" : "Available"}
        </span>
      </div>
    </div>
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

        // 1) Attempt efficient server-side query for exact token matches when categories is an array:
        try {
          const serverQ = query(
            itemsRef,
            where("sold", "==", false),
            where("categories", "array-contains", term) // requires categories stored as array of tokens
          );
          const serverSnap = await getDocs(serverQ);

          if (!serverSnap.empty) {
            const results: Item[] = [];
            serverSnap.forEach((doc) => {
              const data = doc.data() as Record<string, any>;
              results.push({
                id: doc.id,
                title: data.title,
                category: data.category,
                categories: data.categories,
                price: data.price,
                sold: data.sold,
              });
            });
            setMatchedItems(results);
            setLoading(false);
            return; // done: used server results
          }
          // if serverSnap empty, continue to fallback below
        } catch (serverErr) {
          // server query may return empty/no-op if schema differs; just fallback
          // eslint-disable-next-line no-console
          console.debug("Server query failed or returned empty — falling back to client-side filter.", serverErr);
        }

        // 2) Fallback: fetch documents and filter client-side for substring semantics
        const snap = await getDocs(itemsRef);
        const results: Item[] = [];
        snap.forEach((doc) => {
          const data = doc.data() as Record<string, any>;

          // skip sold items
          if (data.sold === true) return;

          // normalize categories field which can be an array or a string
          const categoriesRaw = data.categories ?? data.category ?? "";
          let matches = false;
          if (Array.isArray(categoriesRaw)) {
            matches = categoriesRaw.some((c: any) =>
              String(c || "").toLowerCase().includes(term)
            );
          } else {
            matches = String(categoriesRaw || "").toLowerCase().includes(term);
          }

          if (matches) {
            results.push({
              id: doc.id,
              title: data.title,
              category: data.category,
              categories: data.categories,
              price: data.price,
              sold: data.sold,
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
      <h1 className="text-3xl font-bold mb-4">Available Products</h1>

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

      {/* Warning when Firestore DB is not available */}
      {!db && searchText.trim() !== "" && (
        <div className="mt-2 p-2 text-sm text-yellow-800 bg-yellow-50 border rounded">
          Search unavailable — cannot reach Firestore.
        </div>
      )}
    </div>
  );
}
