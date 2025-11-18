// app/api/requests/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteParams = { id: string };
type RouteContext = { params: Promise<RouteParams> };

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("requests")
    .select(
      `
        id,
        status,
        service,
        mileage,
        description,
        po_number,
        scheduled_at,
        technician:technicians(id, full_name),
        customer:customers(id, name),
        vehicle:vehicles(id, unit_number, year, make, model, plate)
      `
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await supabaseServer();

  const body = await req.json();

  const { data, error } = await supabase
    .from("requests")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
