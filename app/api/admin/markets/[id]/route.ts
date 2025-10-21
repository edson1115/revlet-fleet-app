// app/api/admin/markets/[id]/route.ts
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { supabaseServer } from "@/lib/supabaseServer";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;

  const { ok, company_id } = await requireRole(["ADMIN"]);
  if (!ok || !company_id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const name: string | undefined = body?.name?.trim();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("company_locations")
    .update({ name })
    .eq("id", id)
    .eq("company_id", company_id)
    .eq("location_type", "MARKET");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: Ctx) {
  const { id } = await params;

  const { ok, company_id } = await requireRole(["ADMIN"]);
  if (!ok || !company_id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = await supabaseServer();

  const { count, error: cntErr } = await supabase
    .from("company_customers")
    .select("*", { count: "exact", head: true })
    .eq("company_id", company_id)
    .eq("market", id);

  if (cntErr) return NextResponse.json({ error: cntErr.message }, { status: 500 });
  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "Cannot delete: market has assigned customers" },
      { status: 409 }
    );
  }

  const { error } = await supabase
    .from("company_locations")
    .delete()
    .eq("id", id)
    .eq("company_id", company_id)
    .eq("location_type", "MARKET");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
