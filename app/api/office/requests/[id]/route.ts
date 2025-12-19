import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ============================================================
   GET — Office loads single service request
============================================================ */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const scope = await resolveUserScope();
    if (
      !scope.uid ||
      (!scope.isOffice && !scope.isAdmin && !scope.isSuperadmin)
    ) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = await supabaseServer();

    const { data: request, error } = await supabase
      .from("service_requests")
      .select(
        `
        *,
        customer:customers (
          id,
          name
        ),
        vehicle:vehicles (
          id,
          year,
          make,
          model,
          plate,
          unit_number
        )
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (error || !request) {
      return NextResponse.json(
        { ok: false, error: "Request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, request });
  } catch (e) {
    console.error("OFFICE REQUEST GET ERROR:", e);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}

/* ============================================================
   PATCH — Office updates service definition (LOCKED SAFELY)
============================================================ */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const scope = await resolveUserScope();
    if (!scope.uid || !scope.isOffice) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const supabase = await supabaseServer();

    // --------------------------------------------------
    // Load current status to enforce lock
    // --------------------------------------------------
    const { data: existing, error: loadErr } = await supabase
      .from("service_requests")
      .select("status")
      .eq("id", id)
      .maybeSingle();

    if (loadErr || !existing) {
      return NextResponse.json(
        { ok: false, error: "Request not found" },
        { status: 404 }
      );
    }

    if (
      existing.status !== "NEW" &&
      existing.status !== "WAITING"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Service definition is locked after scheduling",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Update service definition
    // --------------------------------------------------
    const { error } = await supabase
      .from("service_requests")
      .update({
        service_title: body.service_title ?? null,
        service_description: body.service_description ?? null,
        service_override_at: new Date().toISOString(),
        service_override_by: scope.uid,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("SERVICE OVERRIDE PATCH ERROR:", e);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
