// app/api/admin/markets/_health/route.ts
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true, where: "/api/admin/markets/_health" });
}
