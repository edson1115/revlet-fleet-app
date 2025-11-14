import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const body = await req.json().catch(() => ({}));

  const supabase = await supabaseServer();

  // activate ETA
  if (body.op === "set") {
    const minutes = Number(body.minutes);

    const { error } = await supabase
      .from("service_requests")
      .update({
        eta_start: new Date().toISOString(),
        eta_minutes: minutes,
        eta_live: true,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  // clear ETA
  if (body.op === "clear") {
    const { error } = await supabase
      .from("service_requests")
      .update({
        eta_start: null,
        eta_minutes: null,
        eta_live: false,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid operation" }, { status: 400 });
}
