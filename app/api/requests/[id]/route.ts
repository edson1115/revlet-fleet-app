// app/api/requests/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SELECT_FRAG = `
  id, company_id, status, created_at, scheduled_at, started_at, completed_at,
  service, fmc, mileage, po, notes, priority,
  vehicle:vehicle_id ( id, year, make, model, plate, unit_number ),
  customer:customer_id ( id, name ),
  location:location_id ( id, name ),
  technician:technician_id ( id )
`;

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const supabase = await supabaseServer();
  const id = ctx.params.id;

  const { data, error } = await supabase
    .from("service_requests")
    .select(SELECT_FRAG)
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ row: data });
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const supabase = await supabaseServer();
  const id = ctx.params.id;
  const body = await req.json().catch(() => ({} as any));

  const patch: Record<string, any> = {};
  if (Object.prototype.hasOwnProperty.call(body, "notes")) patch.notes = body.notes;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("service_requests")
    .update(patch)
    .eq("id", id)
    .select("notes")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, notes: data?.notes ?? null });
}
