"use client";

import React, { useEffect, useState } from "react";

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
    return categories.some(
      (cat) => typeof cat === "string" && cat.toLowerCase().includes(term)
    );
  }
  if (typeof categories === "string") {
    return categories.toLowerCase().includes(term);
  }
  return false;
}

function isSold(item: any): boolean {
  // Check both field variants, supporting boolean or string 'sold'
  return (
    item.sold === true ||
    (typeof item.status === "string" && item.status.toLowerCase() === "sold")
  );
}

export default function PriceTrends({ category }: { category: string }) {
  const [medianPrice, setMedianPrice] = useState<number>(0);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [recentPrices, setRecentPrices] = useState<
    Array<{ price: number; createdAt?: string }>
  >([]);

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
        const qParam = encodeURIComponent(category.trim());
        const res = await fetch(`/api/price-trends?category=${qParam}`);
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const body = await res.json();
        console.log("PriceTrends fetched", body);
        if (cancelled) return;
        setMedianPrice(Number(body.median) || 0);
        setCount(Number(body.count) || 0);
        setRecentPrices(Array.isArray(body.recent) ? body.recent : []);
      } catch (err) {
        console.error("PriceTrends API error", err);
        if (!cancelled) {
          setMedianPrice(0);
          setCount(0);
          setRecentPrices([]);
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
          <h3 className="font-semibold">
            Median Price (sold, similar categories): {category}
          </h3>
          <div className="text-sm text-gray-500">
            {loading ? "Loading…" : `${count} prices`}
          </div>
        </div>
        {count === 0 ? (
          <div className="text-sm text-gray-500">
            No sold price data found for similar categories.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="text-xl font-bold text-red-600">
              ${medianPrice.toFixed(2)}
            </div>
            <div>
              <Sparkline data={recentPrices} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Sparkline({
  data,
}: {
  data: Array<{ price: number; createdAt?: string }>;
}) {
  const w = 320;
  const h = 64;
  if (!data || data.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No recent sold prices to show.
      </div>
    );
  }

  // Render chronological left->right: oldest -> newest
  const ordered = [...data].reverse();
  const prices = ordered.map((d) => d.price);

  const pad = 6;
  const max = Math.max(...prices);
  const min = Math.min(...prices);
  const range = max - min || 1;
  const step = (w - pad * 2) / Math.max(prices.length - 1, 1);
  const points = prices
    .map((p, i) => {
      const x = pad + i * step;
      const y = pad + (1 - (p - min) / range) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const latest = prices[prices.length - 1];
  const earliest = ordered[0]?.createdAt;
  const newestTs = ordered[ordered.length - 1]?.createdAt;

  const fmt = (s?: string) => {
    if (!s) return "";
    try {
      const d = new Date(s);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return s;
    }
  };

  // color scheme: use site red accent
  const accent = "#C41E3A";
  const areaFill = "rgba(196, 30, 58, 0.2)";

  // compute points and last point coords
  const pointsArray = prices.map((p, i) => {
    const x = pad + i * step;
    const y = pad + (1 - (p - min) / range) * (h - pad * 2);
    return { x, y };
  });
  const pointsStr = pointsArray.map((pt) => `${pt.x},${pt.y}`).join(" ");
  const lastPt = pointsArray[pointsArray.length - 1];

  return (
    <div className="w-full overflow-hidden">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
        {/* area under curve */}
        <polygon
          points={`${pad},${h - pad} ${pointsStr} ${w - pad},${h - pad}`}
          fill={areaFill}
          stroke="none"
        />
        <polyline
          fill="none"
          stroke={accent}
          strokeWidth={2.5}
          points={pointsStr}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* latest point marker */}
        {lastPt && (
          <circle
            cx={lastPt.x}
            cy={lastPt.y}
            r={3.5}
            fill={accent}
            stroke="#fff"
            strokeWidth={0.8}
          />
        )}
      </svg>
      <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
        <div>Start: {fmt(earliest)}</div>
        <div className="text-red-600 font-medium">
          Latest: ${latest.toFixed(2)}
        </div>
        <div>End: {fmt(newestTs)}</div>
      </div>
    </div>
  );
}
