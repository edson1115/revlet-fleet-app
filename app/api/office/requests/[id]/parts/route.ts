import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* =====================================================
   GET — Load parts for request
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

  /* ------------------------------
     LOAD PROFILE ROLE
  ------------------------------ */
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const READ_ALLOWED = new Set([
    "OFFICE",
    "DISPATCH",
    "TECH",
    "ADMIN",
    "SUPERADMIN",
  ]);

  if (!profile || !READ_ALLOWED.has(profile.role)) {
    return NextResponse.json(
      { error: "Permission denied" },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("service_request_parts")
    .select(`
      id,
      part_number,
      description,
      quantity,
      vendor,
      created_at
    `)
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("LOAD PARTS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load parts" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    parts: data ?? [],
  });
}

/* =====================================================
   POST — Add part (Office only)
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const WRITE_ALLOWED = new Set([
    "OFFICE",
    "ADMIN",
    "SUPERADMIN",
  ]);

  if (!profile || !WRITE_ALLOWED.has(profile.role)) {
    return NextResponse.json(
      { error: "Permission denied" },
      { status: 403 }
    );
  }

  const body = await req.json();

  const part_number = body.part_number?.trim();
  const description = body.description?.trim() || null;
  const quantity = Number(body.quantity) || 1;
  const vendor = body.vendor?.trim() || null;

  if (!part_number) {
    return NextResponse.json(
      { error: "Part number is required" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("service_request_parts")
    .insert({
      request_id: id,
      part_number,
      description,
      quantity,
      vendor,
    });

  if (error) {
    console.error("INSERT PART ERROR:", error);
    return NextResponse.json(
      { error: "Failed to add part" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
