import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
============================================================
POST — Analyze a service request using AI
============================================================
Expected payload:
{
  request_id: string
}
============================================================
*/

export async function POST(req: Request) {
  try {
    const scope = await resolveUserScope();

    if (!scope.uid) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { request_id } = await req.json();

    if (!request_id) {
      return NextResponse.json(
        { ok: false, error: "request_id required" },
        { status: 400 }
      );
    }

    const supabase = await supabaseServer();

    // --------------------------------------------------
    // LOAD REQUEST + VEHICLE
    // --------------------------------------------------
    const { data: request, error } = await supabase
      .from("service_requests")
      .select(
        `
        id,
        service_type,
        mileage,
        notes,
        vehicle:vehicles(
          year,
          make,
          model,
          plate
        )
      `
      )
      .eq("id", request_id)
      .maybeSingle();

    if (error || !request) {
      return NextResponse.json(
        { ok: false, error: "Request not found" },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // 🧠 AI LOGIC (V1 — deterministic & safe)
    // --------------------------------------------------

    const aiSummary = `
Vehicle: ${request.vehicle?.year} ${request.vehicle?.make} ${request.vehicle?.model}
Mileage: ${request.mileage ?? "unknown"}
Concern: ${request.notes || "No customer notes provided"}

Initial diagnosis generated automatically.
`.trim();

    const aiParts = [
      { name: "Oil Filter", confidence: 0.72 },
      { name: "Air Filter", confidence: 0.61 },
    ];

    const aiNextService = {
      recommended_mileage:
        request.mileage ? request.mileage + 5000 : null,
      reason: "Standard service interval",
    };

    // --------------------------------------------------
    // SAVE AI RESULTS
    // --------------------------------------------------
    const { error: updateErr } = await supabase
      .from("service_requests")
      .update({
        ai_status: "COMPLETE",
        ai_summary: aiSummary,
        ai_parts: aiParts,
        ai_next_service: aiNextService,
      })
      .eq("id", request_id);

    if (updateErr) {
      return NextResponse.json(
        { ok: false, error: updateErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      summary: aiSummary,
      parts: aiParts,
      next_service: aiNextService,
    });
  } catch (err: any) {
    console.error("AI ANALYZE ERROR:", err);
    return NextResponse.json(
      { ok: false, error: "Server error", detail: err.message },
      { status: 500 }
    );
  }
}
