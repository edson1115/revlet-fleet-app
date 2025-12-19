import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* =====================================================
   GET — Load notes timeline
===================================================== */
export async function GET(
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

  const { data, error } = await supabase
    .from("service_request_notes")
    .select(`
      id,
      role,
      note,
      created_at
    `)
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("LOAD NOTES ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load notes" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    notes: data ?? [],
  });
}

/* =====================================================
   POST — Add internal note
===================================================== */
export async function POST(
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

  const role = normalizeRole(user.user_metadata?.role);

  const ALLOWED = new Set([
    "OFFICE",
    "DISPATCH",
    "TECH",
    "ADMIN",
    "SUPERADMIN",
  ]);

  if (!ALLOWED.has(role || "")) {
    return NextResponse.json(
      { error: "Permission denied" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const note = body.note?.trim();

  if (!note) {
    return NextResponse.json(
      { error: "Note is required" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("service_request_notes")
    .insert({
      request_id: id,
      role,
      note,
    });

  if (error) {
    console.error("INSERT NOTE ERROR:", error);
    return NextResponse.json(
      { error: "Failed to save note" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
