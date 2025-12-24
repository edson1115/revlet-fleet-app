import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/* =========================================================
   GET — Office Request Viewer (SCHEMA-CLEAN)
   - NO guessed columns
   - NO dispatch fields
========================================================= */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // ✅ Next.js 15 compliant param access
  const { id: requestId } = await context.params;
  console.log("🔍 FETCHING REQUEST ID:", requestId);

  /* -------------------------------------------------
     LOAD REQUEST — ONLY CONFIRMED COLUMNS
  ------------------------------------------------- */
  const { data: request, error } = await supabase
    .from("requests")
    .select(
  `
  id,
  status,
  service,
  created_at,

  customer:customers (
    id,
    name
  ),

  vehicle:vehicles (
    year,
    make,
    model,
    plate,
    unit_number
  )
  `
)

    .eq("id", requestId)
    .maybeSingle();

  if (error) {
    console.error("❌ REQUEST LOAD ERROR:", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  if (!request) {
    return NextResponse.json(
      { ok: false, error: "Request not found" },
      { status: 404 }
    );
  }

  /* -------------------------------------------------
     LOAD PARTS (READ ONLY)
  ------------------------------------------------- */
  const { data: parts } = await supabase
    .from("request_parts")
    .select(
      `
      id,
      part_number,
      description,
      quantity,
      status,
      created_at
    `
    )
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });

  /* -------------------------------------------------
     LOAD AUDIT TIMELINE
  ------------------------------------------------- */
  const { data: audit } = await supabase
    .from("request_audit")
    .select(
      `
      id,
      action,
      actor_role,
      actor_email,
      created_at
    `
    )
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    ok: true,
    request: {
      ...request,
      parts: parts ?? [],
      audit: audit ?? [],
    },
  });
}
