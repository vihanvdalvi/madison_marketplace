"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
// import Image from "next/image";
import { CldImage } from "next-cloudinary";
// -------------------- Firebase init (safe, single source) --------------------
// Prefer runtime global __firebase_config (used elsewhere in the project) and fallback to NEXT_PUBLIC_FIREBASE_CONFIG
const rawConfig =
  typeof window !== "undefined"
    ? // runtime: prefer global set before render
      (window as any).__firebase_config ??
      (process.env.NEXT_PUBLIC_FIREBASE_CONFIG as any)
    : (process.env.NEXT_PUBLIC_FIREBASE_CONFIG as any);

let firebaseConfig: Record<string, any> = {};
if (rawConfig) {
  try {
    firebaseConfig =
      typeof rawConfig === "string" ? JSON.parse(rawConfig) : rawConfig;
  } catch (e) {
    // invalid JSON or unexpected shape - keep firebaseConfig empty
    // eslint-disable-next-line no-console
    console.error("Failed to parse firebase config:", e);
    firebaseConfig = {};
  }
}

const hasFirebaseConfig = !!firebaseConfig && !!firebaseConfig.apiKey;

// Keep references optional to avoid using Firebase when not configured
// let app: FirebaseApp | undefined;
// let auth: Auth | undefined;
// let db: Firestore | undefined;

// if (hasFirebaseConfig) {
//   try {
//     app = initializeApp(firebaseConfig);
//     auth = getAuth(app);
//     db = getFirestore(app);
//   } catch (e) {
//     // initialization failed — leave as undefined and log for debugging
//     // eslint-disable-next-line no-console
//     console.error("Firebase init error:", e);
//     app = undefined;
//     auth = undefined;
//     db = undefined;
//   }
// }
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
  <div className="relative overflow-hidden rounded-2xl shadow-lg bg-white/60 backdrop-blur-md border border-white/30 transform-gpu hover:scale-105 transition">
    <div className="relative w-full h-48 bg-gradient-to-br from-white/50 to-white/30">
      {item.id ? (
        <CldImage
          src={"madison-marketplace/" + item.id}
          alt={item.title ?? "Product image"}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover rounded-t-xl"
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full text-gray-400">
          No image
        </div>
      )}

      <div className="absolute left-3 bottom-3 bg-linear-to-r from-white/80 to-white/60 text-sm font-semibold text-gray-900 px-3 py-1 rounded-full shadow">
        ${item.price ?? "—"}
      </div>
    </div>

    <div className="p-4">
      <div className="flex flex-col">
        <div className="text-md font-semibold text-gray-800 truncate">
          {item.title ?? item.category ?? "Untitled"}
        </div>
        <div className="text-sm text-gray-500 mt-1">{item.category}</div>
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

      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search categories, e.g. 'electronics'"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full p-3 rounded-xl text-lg bg-white/60 backdrop-blur-sm border border-white/30 outline-none shadow-inner focus:shadow-outline transition placeholder-gray-500"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
          ⌘K
        </div>
      </div>

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
          {/* optional card view */}
          <div className="grid grid-cols-1 md:grid-cols-2 mt-2 lg:grid-cols-3 gap-4">
            {matchedItems.map((item) => (
              <Link
                href={`/listings/${item.id}`}
                key={item.id}
                className="transform-gpu hover:scale-105 transition"
              >
                <ItemCard key={item.id} item={item} />
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500 py-10">No items found</p>
      )}
    </div>
  );
}
