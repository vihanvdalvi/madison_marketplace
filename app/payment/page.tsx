"use client";

import React, { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

// `setSold` is a server-side helper; call it via the server API route below.

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
export default function Payments() {
  const params = useParams();
  const itemId = params?.itemId ?? "";

const searchParams = useSearchParams();
const priceParam = searchParams?.get("price");
const price = priceParam ? Number(priceParam) : undefined;

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
    if (!/^\d{1,2}\/\d{2}$/.test(expiry))
      return setMessage("Expiry must be MM/YY.");
    setLoading(true);
      try {
      // Simulate payment processing and then notify the server to mark item as sold

      // Ensure itemId is a string (it can be string | string[])
      const itemIdStr = Array.isArray(itemId) ? itemId[0] ?? "" : itemId;
      const req_id = itemIdStr.replace("madison-marketplace/", "");

      const res = await fetch("/api/set-sold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: req_id }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to mark item sold");
      }

      setMessage("Payment successful! Thank you for your purchase.");
    } catch (err) {
      setMessage(
        "Payment processed but we couldn't update the listing. Please contact support."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Complete Payment</h2>
      <p className="text-sm text-gray-600 mb-4">
        Price: {price ? `$${price}` : "—"}
      </p>
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
