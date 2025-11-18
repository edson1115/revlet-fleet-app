// app/api/requests/[id]/auto-integrate/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = { id: string };
type RouteContext = { params: Promise<Params> };

export async function POST(req: Request, context: RouteContext) {
  const { id } = await context.params;

  const supabase = await supabaseServer();

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const {
    mileage,
    services,
    notes,
    recommended,
    submitted_by,
  } = body;

  // Basic validation
  if (!submitted_by) {
    return NextResponse.json(
      { error: "submitted_by is required" },
      { status: 400 }
    );
  }

  // This mirrors your Navex AutoIntegrate flow (customer lookup, VIN, mileage, notes, approvals, etc.)
  const { error } = await supabase
    .from("auto_integrate_submissions")
    .insert({
      request_id: id,
      mileage: mileage ?? null,
      services: services ?? [],
      recommended: recommended ?? [],
      notes: notes ?? "",
      submitted_by,
      submitted_at: new Date().toISOString(),
    });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  // Update request status to WAITING_APPROVAL
  await supabase
    .from("requests")
    .update({
      status: "WAITING_APPROVAL",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  return NextResponse.json(
    { message: "AutoIntegrate submission recorded" },
    { status: 200 }
  );
}
