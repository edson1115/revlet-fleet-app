// app/api/requests/[id]/start/route.ts
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/authz";
// import { db } from "@/lib/db";

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { companyId } = requireRole(["ADMIN", "DISPATCH"]);
    const { id } = await params;

    // const { error } = await db.from("requests")
    //   .update({ status: "IN_PROGRESS", started_at: new Date().toISOString() })
    //   .eq("id", id)
    //   .eq("company_id", companyId);
    // if (error) throw Object.assign(new Error(error.message), { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const status = e?.status ?? 500;
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status });
  }
}
