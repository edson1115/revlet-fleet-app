// app/api/admin/request-access/route.ts
import { NextResponse } from "next/server";
import { getAppIdentity } from "@/lib/authz";
// import { db } from "@/lib/db";

export async function POST() {
  try {
    const { companyId } = getAppIdentity();
    // Insert a "pending access" record for the current email if you track it
    // await db.from("access_requests").insert({ email: ..., company_id: companyId, status: "PENDING" })
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: e?.status ?? 500 });
  }
}
