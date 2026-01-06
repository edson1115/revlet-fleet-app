import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing request id" }, { status: 400 });
    }

    const supabase = await supabaseServer();

    const { data, error } = await supabase
      .from("service_requests")
      .select(`
  id,
  status,
  created_at,
  scheduled_start_at,
  started_at,
  waiting_for_parts_at,
  waiting_for_approval_at,
  completed_at,
  completed_by_role,
  technician_notes,
  office_notes,
  dispatch_notes,
  vehicle:vehicles (
    year,
    make,
    model,
    plate
  )
`)

      .eq("id", id)
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, lifecycle: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to load lifecycle" },
      { status: 500 }
    );
  }
}
