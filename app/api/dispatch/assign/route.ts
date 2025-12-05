import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = String(body.id || "");
    const when = String(body.when || "");
    const notes = (body.notes || "") as string;
    const tech_ids: string[] = Array.isArray(body.tech_ids) ? body.tech_ids : [];

    if (!id)   return NextResponse.json({ error: "Missing request id" }, { status: 400 });
    if (!when) return NextResponse.json({ error: "Missing schedule time" }, { status: 400 });
    if (tech_ids.length === 0) return NextResponse.json({ error: "Pick at least one tech" }, { status: 400 });
    if (tech_ids.length > 5)   return NextResponse.json({ error: "Max 5 techs" }, { status: 400 });

    const supabase = await supabaseServer();

    const { data: rq, error: rqErr } = await supabase
      .from("service_requests")
      .select("company_id")
      .eq("id", id)
      .single();
    if (rqErr) throw rqErr;

    const company_id = rq?.company_id as string | null;
    if (!company_id) return NextResponse.json({ error: "Request has no company" }, { status: 400 });

    const scheduledISO = new Date(when).toISOString();

    // 1) schedule + note
    {
      const { error } = await supabase
        .from("service_requests")
        .update({ status: "SCHEDULED", scheduled_at: scheduledISO, notes: (notes ?? "").trim() || null })
        .eq("id", id)
        .eq("company_id", company_id);
      if (error) throw error;
    }

    // 2) upsert tech assignments
    {
      const { error: delErr } = await supabase.from("request_techs").delete().eq("request_id", id);
      if (delErr) throw delErr;

      const rows = tech_ids.map((tid, idx) => ({ request_id: id, tech_id: tid, position: idx + 1, company_id }));
      const { error: insErr } = await supabase.from("request_techs").insert(rows);
      if (insErr) throw insErr;
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to assign" }, { status: 500 });
  }
}



