// app/api/admin/set-role/route.ts
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/authz";
// import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { companyId } = requireRole(["ADMIN"]);
    const { id, role } = await req.json();

    // const { error } = await db.from("app_users")
    //   .update({ role, status: "ACTIVE" })
    //   .eq("id", id)
    //   .eq("company_id", companyId);
    // if (error) throw Object.assign(new Error(error.message), { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: e?.status ?? 500 });
  }
}
