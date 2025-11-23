import { NextRequest, NextResponse } from "next/server";
import { db } from "../../helpers/firebase";

function normalizeWord(w: string) {
  return String(w || "")
    .toLowerCase()
    .trim();
}

function tokenize(str: string) {
  // split on non-word characters, filter empties
  return String(str || "")
    .toLowerCase()
    .split(/\W+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  const term = normalizeWord(q);
  if (!term) return NextResponse.json([], { status: 200 });

  try {
    // Query top-level "price-directory" collection (documents created by upload route)
    const itemsRef = db.collection("price-directory");

    // Fetch unsold items server-side then perform exact-word matching
    const snap = await itemsRef.where("sold", "==", false).get();

    const results = snap.docs
      .map((doc) => {
        const data = doc.data() as Record<string, any>;
        console.log("DATA: ", data);
        return {
          id: doc.id,
          description: data.description || "",
          category: data.category || "",
          categories: data.categories || "",
          price: data.price || 0,
          sold: data.sold || false,
          imageUrl: data.imageUrl || "",
          publicId: data.publicId || "",
        };
      })
      .filter((item) => {
        // normalize categories: support array or string
        const categoriesRaw = item.categories ?? item.category ?? "";
        if (Array.isArray(categoriesRaw)) {
          // each element may contain multiple words; tokenize and check exact equality
          return categoriesRaw.some((el: any) =>
            tokenize(String(el)).some((token) => token.includes(term))
          );
        } else {
          // string -> tokenize and check exact equality
          return tokenize(String(categoriesRaw)).some((token) =>
            token.includes(term)
          );
        }
      });

    return NextResponse.json(results, { status: 200 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Search route error:", err);
    return NextResponse.json({ error: "search_failed" }, { status: 500 });
  }
}
