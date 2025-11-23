"use client";

import React, { useState } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

// Read firebase config injected at runtime (same pattern used elsewhere)
declare const __firebase_config: string | undefined;
declare const __app_id: string | undefined;
const firebaseConfig = JSON.parse(typeof __firebase_config !== "undefined" ? __firebase_config : "{}");
const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function luhnCheck(cardNumber: string) {
  const sanitized = cardNumber.replace(/\D/g, "");
  let sum = 0;
  let shouldDouble = false;
  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export default function Payments({ itemId, price }: { itemId: string; price?: number }) {
  const [name, setName] = useState("");
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Basic validations (do NOT store any card data)
    if (!name.trim()) return setMessage("Please enter the cardholder's name.");
    if (!luhnCheck(card)) return setMessage("Invalid card number.");
    if (!/^\d{3,4}$/.test(cvc)) return setMessage("Invalid CVC.");
    if (!/^\d{1,2}\/\d{2}$/.test(expiry)) return setMessage("Expiry must be MM/YY.");

    setLoading(true);

    try {
      // Ensure we are authenticated (anonymous) so Firestore rules allow update
      await signInAnonymously(auth);

      // Update the item's document to mark sold. We set both `sold: true` and `status: 'sold'`
      const docRef = doc(db, "artifacts", appId, "public", "data", "items", itemId);
      await updateDoc(docRef, { sold: true, status: "sold" });

      setMessage(
        `Payment simulated for ${price ? `$${price}` : "this item"}. Item marked as sold.`
      );
    } catch (err: any) {
      console.error("Failed to mark item sold", err);
      setMessage("Failed to mark item as sold. Check console for details.");
    } finally {
      setLoading(false);

      // Clear sensitive fields immediately
      setCard("");
      setCvc("");
      setExpiry("");
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Complete Payment</h2>
      <p className="text-sm text-gray-600 mb-4">Price: {price ? `$${price}` : "—"}</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-sm">Cardholder Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded mt-1"
            placeholder="Jane Q. Student"
            required
          />
        </div>

        <div>
          <label className="text-sm">Card Number</label>
          <input
            value={card}
            onChange={(e) => setCard(e.target.value)}
            className="w-full p-2 border rounded mt-1"
            placeholder="4242 4242 4242 4242"
            inputMode="numeric"
            required
          />
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-sm">Expiry (MM/YY)</label>
            <input
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="w-full p-2 border rounded mt-1"
              placeholder="08/28"
              required
            />
          </div>
          <div style={{ width: 110 }}>
            <label className="text-sm">CVC</label>
            <input
              value={cvc}
              onChange={(e) => setCvc(e.target.value)}
              className="w-full p-2 border rounded mt-1"
              placeholder="123"
              inputMode="numeric"
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-[#C41E3A] text-white rounded hover:bg-[#9E1A2D] disabled:opacity-60"
          >
            {loading ? "Processing…" : `Pay ${price ? `$${price}` : "Now"}`}
          </button>
        </div>
      </form>

      {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}
    </div>
  );
}
