// app/api/admin/set-role/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireRole } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Role = "CUSTOMER" | "OFFICE" | "DISPATCH" | "TECH" | "ADMIN" | "FLEET_MANAGER";

export async function POST(req: Request) {
  try {
    // Ensure only ADMIN can set roles
    await requireRole(["ADMIN"]); // do not destructure; it’s async and returns void/throws

    const body = (await req.json().catch(() => ({}))) as { id?: string; role?: Role };
    const id = body.id?.trim();
    const role = body.role;

    if (!id || !role) {
      return NextResponse.json({ error: "Missing id or role" }, { status: 400 });
    }

    const allowed: Role[] = ["CUSTOMER", "OFFICE", "DISPATCH", "TECH", "ADMIN", "FLEET_MANAGER"];
    if (!allowed.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const supabase = await supabaseServer();
    const { error } = await supabase.from("profiles").update({ role }).eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    // If requireRole throws a “forbidden”, honor it
    if (msg.toLowerCase().includes("forbidden") || msg.toLowerCase().includes("unauthorized")) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
