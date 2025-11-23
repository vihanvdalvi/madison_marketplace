import { NextResponse } from "next/server";
import { db } from "@/app/helpers/firebase";

function median(numbers: number[]): number {
  if (!numbers.length) return 0;
  const sorted = numbers.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
}

function normalizeTerm(t?: any) {
  if (!t) return "";
  return String(t).trim().toLowerCase();
}

function matchesCategory(item: any, search: string) {
  if (!search) return true;
  // split multi-word category into individual terms and match any term
  const terms = String(search || "")
    .toLowerCase()
    .split(/\W+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!terms.length) return true;

  const cats = item.categories ?? item.categories_string ?? null;
  const main = item.main_category ?? item.mainCategory ?? null;

  for (const term of terms) {
    // categories may be string or array
    if (Array.isArray(cats)) {
      if (
        cats.some(
          (c) => typeof c === "string" && c.toLowerCase().includes(term)
        )
      )
        return true;
    } else if (typeof cats === "string" && cats.toLowerCase().includes(term))
      return true;

    // main_category field also supported
    if (typeof main === "string" && main.toLowerCase().includes(term))
      return true;

    // fallback: title or categories-like fields
    if (
      typeof item.category === "string" &&
      item.category.toLowerCase().includes(term)
    )
      return true;
  }

  return false;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get("category") ?? "";
    // Read recent documents from `price-directory` (server-side) and filter sold items
    const colRef = db.collection("price-directory");

    // Fetch recent docs ordered by createdAt if available, otherwise fall back
    let snap;
    try {
      const q = colRef.orderBy("createdAt", "desc").limit(500);
      snap = await q.get();
    } catch (err) {
      // fallback to simple get() on collection (no ordering)
      snap = await colRef.limit(500).get();
    }

    const rows: Array<{ price: number; createdAt?: string }> = [];

    snap.docs.forEach((d) => {
      const data = d.data();
      // sold indicator may be boolean or string
      const sold =
        data.sold === true || String(data.sold).toLowerCase() === "true";
      if (!sold) return;

      if (!matchesCategory(data, category)) return;

      const rawPrice = data.price ?? data.price_usd ?? data.amount ?? null;
      const price = Number(rawPrice) || 0;
      if (price <= 0) return;

      let created: string | undefined = undefined;
      const c = data.createdAt ?? data.created_at ?? data.timestamp ?? null;
      if (
        c &&
        typeof c === "object" &&
        typeof (c as any).toDate === "function"
      ) {
        created = (c as any).toDate().toISOString();
      } else if (typeof c === "string") {
        created = c;
      }

      rows.push({ price, createdAt: created });
    });

    // rows are in descending createdAt order from query; take most recent N
    const recent = rows.slice(0, 100);
    const priceArray = recent.map((r) => r.price);
    const med = median(priceArray);

    return NextResponse.json({
      category: category || null,
      median: med,
      count: priceArray.length,
      recent,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("/api/price-trends error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
}
