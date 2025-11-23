"use client";

import React, { useState, useEffect, useRef } from "react";
// import Image from "next/image";
import { CldImage } from "next-cloudinary";
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
  title?: string | null;
  category?: string | null;
  categories?: string[] | string | null;
  price?: number | null;
  sold?: boolean | null;
  imageUrl?: string | null;
  publicId?: string | null;
}

// Reusable ItemCard (matches product card style used in browse)
const ItemCard = ({ item }: { item: any }) => (
  <div className="border p-0 rounded-lg shadow-sm bg-white hover:shadow-md transition overflow-hidden">
    <div className="relative w-full h-48 bg-gray-100">
      {item.id ? (
        <CldImage
          src={"madison-marketplace/" + item.id}
          alt={item.title ?? "Product image"}
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
        <h3 className="text-md font-semibold text-gray-800">{item.title ?? "Untitled"}</h3>
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
  const [matchedItems, setMatchedItems] = useState<Item[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const debounceRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!searchText || searchText.trim() === "") {
      setMatchedItems([]);
      setLoading(false);
      setApiError(null);
      return;
    }

    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      const q = encodeURIComponent(searchText.trim());
      try {
        setApiError(null);
        const res = await fetch(`/api/search?q=${q}`);
        if (!res.ok) {
          setApiError("Cannot access Firestore — search unavailable.");
          setMatchedItems([]);
          setLoading(false);
          return;
        }
        const data = await res.json();

        // --------- CHANGED: populate imageUrl from Cloudinary publicId/id if missing ----------
        // resolve cloud name and optional folder from runtime global or env
        // const cloudName =
        //   typeof window !== "undefined"
        //     ? (window as any).__cloudinary?.cloudName ?? (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as any)
        //     : (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as any);
        // const uploadFolder = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_FOLDER ?? "";

        // if (cloudName) {
        //   items = items.map((it: any) => {
        //     // only assign if no explicit imageUrl exists
        //     if (!it.imageUrl) {
        //       const pid = it.publicId ?? it.id;
        //       if (pid) {
        //         console.log("Generating imageUrl for pid:", pid);
        //         // ensure file extension (assume .jpg if none)
        //         const hasExt = /\.(jpg|jpeg|png|gif|webp)$/i.test(pid);
        //         const ext = hasExt ? "" : ".jpg";
        //         const folderSegment = uploadFolder ? `${encodeURIComponent(uploadFolder)}/` : "";
        //         it.imageUrl = `https://res.cloudinary.com/${encodeURIComponent(
        //           cloudName
        //         )}/image/upload/${folderSegment}${encodeURIComponent(pid)}${ext}`;
        //       }
        //     }
        //     return it;
        //   });
        // }
        // console.log("Search matched items:", items);
        console.log("Search matched items:", data);
        setMatchedItems(data);
        // --------- end CHANGED ----------
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Search fetch error:", err);
        setApiError("Cannot access Firestore — search unavailable.");
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
        placeholder="Type a single keyword that matches a category word..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className="w-full p-3 border rounded-lg text-lg focus:ring-2 focus:ring-blue-500 outline-none mb-3"
      />

      {apiError && searchText.trim() !== "" && (
        <div className="mb-4 p-2 text-sm text-yellow-800 bg-yellow-50 border rounded">
          {apiError}
        </div>
      )}

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
