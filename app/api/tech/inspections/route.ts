import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/api/scope";

export async function POST(req: Request) {
  const scope = await resolveUserScope();
  if (!scope.uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { request_id, checklist_data } = await req.json();

    if (!request_id || !checklist_data) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const supabase = await supabaseServer();

    // Insert Inspection
    const { data, error } = await supabase
      .from("job_inspections")
      .insert({
        request_id,
        technician_id: scope.uid,
        checklist_data,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, inspection: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}