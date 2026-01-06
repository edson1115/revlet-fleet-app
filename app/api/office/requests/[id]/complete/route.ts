import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await supabaseServer();
    const { id } = await params;
    
    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    // 2. Mark as Completed
    const { data, error } = await supabase
      .from("service_requests")
      .update({
        status: "COMPLETED",
        completed_by_role: "OFFICE",
        completed_at: new Date().toISOString(),
        completion_note: body.completion_note,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, completed_at: data.completed_at });

  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}