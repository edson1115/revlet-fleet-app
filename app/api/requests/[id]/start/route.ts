// app/api/requests/[id]/start/route.ts
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/authz";
// import { db } from "@/lib/db";

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { companyId } = await requireRole(["ADMIN", "DISPATCH"]); // ← await
    const { id } = await params;

    // await db.from("requests")
    //   .update({ status: "IN_PROGRESS", started_at: new Date().toISOString() })
    //   .eq("id", id)
    //   .eq("company_id", companyId)
    //   .throwOnError();

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const status = e?.status ?? 500;
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status });
  }
}
