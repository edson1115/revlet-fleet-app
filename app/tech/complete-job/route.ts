import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();
    const { id } = await req.json();

    const { error } = await supabase
      .from("service_requests")
      .update({
        status: "COMPLETED",
        completed_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}