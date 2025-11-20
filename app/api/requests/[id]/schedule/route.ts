import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = params.id;
    const payload = await req.json();

    const { technician_id, start_time, end_time } = payload;
    if (!technician_id || !start_time || !end_time) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();

    const scheduledAt = `${new Date().toISOString().split("T")[0]}T${start_time}:00`;

    const { error } = await supabase
      .from("requests")
      .update({
        technician_id,
        scheduled_at: scheduledAt,
        eta: start_time,
        status: "SCHEDULED",
      })
      .eq("id", requestId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
