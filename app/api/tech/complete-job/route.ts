import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();
    const { id, mileage, inspection, recommendations, notes, photos } = await req.json();

    console.log("📝 COMPLETING JOB:", { id, photoCount: photos?.length });

    const { error } = await supabase
      .from("service_requests")
      .update({
        status: "COMPLETED",
        completed_at: new Date().toISOString(),
        mileage: parseInt(mileage) || 0,
        inspection_data: inspection || {},
        recommendations: recommendations || "",
        technician_notes: notes || "",
        photos: photos || [] // Save the array of filenames
      })
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Complete Error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}