// app/api/requests/[id]/po/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/requests/:id/po
 * Body: { po_number: string }
 * Office/Admin can set PO number.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = await supabaseServer();
  const { id } = params;

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id || null;
  if (!uid) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { data: prof } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", uid)
    .maybeSingle();

  const role = String(prof?.role || "").toUpperCase();
  if (!["OFFICE", "ADMIN", "DISPATCHER"].includes(role)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const po_number = typeof body?.po_number === "string" ? body.po_number.trim() : "";

  // company check
  const { data: reqRow } = await supabase
    .from("service_requests")
    .select("company_id")
    .eq("id", id)
    .maybeSingle();

  if (reqRow?.company_id && prof?.company_id && reqRow.company_id !== prof.company_id && role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "cross-company forbidden" }, { status: 403 });
  }

  const { data: updated, error } = await supabase
    .from("service_requests")
    .update({ po_number: po_number || null })
    .eq("id", id)
    .select("id, po_number, updated_at")
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data: updated });
}
