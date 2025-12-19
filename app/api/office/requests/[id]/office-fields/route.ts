import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* =====================================================
   PATCH — Update Office Internal Fields
===================================================== */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  /* ------------------------------
     LOAD PROFILE ROLE
  ------------------------------ */
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const ALLOWED = new Set([
    "OFFICE",
    "ADMIN",
    "SUPERADMIN",
  ]);

  if (!profile || !ALLOWED.has(profile.role)) {
    return NextResponse.json(
      { error: "Permission denied" },
      { status: 403 }
    );
  }

  const body = await req.json();

  const po = body.po?.trim() || null;
  const invoice_number = body.invoice_number?.trim() || null;
  const office_notes = body.office_notes?.trim() || null;

  const { error } = await supabase
    .from("service_requests")
    .update({
      po,
      invoice_number,
      office_notes,
    })
    .eq("id", id);

  if (error) {
    console.error("UPDATE OFFICE FIELDS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to save office fields" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
