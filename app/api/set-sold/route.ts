import { NextResponse } from "next/server";
import setSold from "../../helpers/setSold";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { itemId } = body;
    if (!itemId) {
      return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
    }

    const result = await setSold(itemId);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json(
      { error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
