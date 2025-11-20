import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest, { params }: any) {
  const id = params.id;
  const body = await req.json();
  const action = body.action;

  const timestamp = new Date().toISOString();

  const colMap: any = {
    DISPATCHED: "dispatched_at",
    EN_ROUTE: "en_route_at",
    ARRIVED: "arrived_at",
    STARTED: "started_at",
    COMPLETED: "completed_at",
  };

  const col = colMap[action];
  if (!col) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { data, error } = await supabaseServer()
    .from("requests")
    .update({ [col]: timestamp })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, request: data });
}
