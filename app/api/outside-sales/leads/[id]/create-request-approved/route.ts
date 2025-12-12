import { supabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: any) {
  const leadId = params.id;
  const body = await req.json();

  const supabase = await supabaseServer();

  const { data: lead } = await supabase
    .from("sales_leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (!lead) return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });

  const { data: sr, error } = await supabase
    .from("service_requests")
    .insert({
      customer_id: body.customerId,
      vehicle_id: body.vehicleId,
      service: body.service,
      status: "WAITING_TO_BE_SCHEDULED",
      fmc: "OUTSIDE_SALES",
      created_by: body.salesRepId,
      priority: body.urgent ? "HIGH" : "NORMAL",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message });

  return NextResponse.json({ ok: true, request: sr });
}
