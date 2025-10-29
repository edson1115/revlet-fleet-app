// app/api/requests/[id]/technician/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Who can assign technicians:
 *  - ADMIN, OFFICE, DISPATCHER
 *  - TECH and CUSTOMER are denied
 */
function roleCanAssign(role?: string | null) {
  const r = String(role || "").toUpperCase();
  return r === "ADMIN" || r === "OFFICE" || r === "DISPATCHER";
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const supabase = await supabaseServer();
  const id = ctx.params.id;

  // Who is calling?
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id || null;
  if (!uid) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });

  // Caller profile
  const { data: prof, error: profErr } = await supabase
    .from("profiles")
    .select("id, role, company_id, full_name, email")
    .eq("id", uid)
    .maybeSingle();
  if (profErr) return NextResponse.json({ ok: false, error: profErr.message }, { status: 500 });

  if (!roleCanAssign(prof?.role)) {
    return NextResponse.json({ ok: false, error: "Forbidden: your role cannot assign technicians." }, { status: 403 });
  }

  // Parse body
  const body = await req.json().catch(() => ({} as any));
  const technician_id_raw = body?.technician_id; // string | null | undefined
  const technician_id =
    technician_id_raw === null || technician_id_raw === "" ? null : String(technician_id_raw);

  // Load request
  const { data: reqRow, error: reqErr } = await supabase
    .from("service_requests")
    .select("id, company_id, technician_id")
    .eq("id", id)
    .maybeSingle();
  if (reqErr) return NextResponse.json({ ok: false, error: reqErr.message }, { status: 500 });
  if (!reqRow) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  // Company safety (ADMIN may span companies; others must match)
  const callerCompany = prof?.company_id || null;
  if (callerCompany && reqRow.company_id && callerCompany !== reqRow.company_id) {
    const role = String(prof?.role || "").toUpperCase();
    if (role !== "ADMIN") {
      return NextResponse.json({ ok: false, error: "Cross-company forbidden." }, { status: 403 });
    }
  }

  // Optional: verify technician exists (if provided)
  if (technician_id) {
    const { data: tech, error: techErr } = await supabase
      .from("technicians")
      .select("id, company_id, name")
      .eq("id", technician_id)
      .maybeSingle();
    if (techErr) return NextResponse.json({ ok: false, error: techErr.message }, { status: 500 });
    if (!tech) return NextResponse.json({ ok: false, error: "Technician not found." }, { status: 400 });

    // Company match for technician (ADMIN can override)
    const role = String(prof?.role || "").toUpperCase();
    if (callerCompany && tech.company_id && tech.company_id !== callerCompany && role !== "ADMIN") {
      return NextResponse.json({ ok: false, error: "Technician belongs to another company." }, { status: 403 });
    }
  }

  // Update assignment
  const { data: updated, error: upErr } = await supabase
    .from("service_requests")
    .update({ technician_id })
    .eq("id", id)
    .select("id, technician_id, company_id, status, updated_at")
    .maybeSingle();

  if (upErr) return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });

  // Audit event (best-effort; ignore failure)
  try {
    await supabase.from("service_events").insert({
      request_id: id,
      event_type: "ASSIGN_TECH",
      message: technician_id
        ? `Assigned tech -> ${technician_id}`
        : "Cleared technician",
      created_by: uid,
    });
  } catch {}

  return NextResponse.json({ ok: true, data: updated });
}
