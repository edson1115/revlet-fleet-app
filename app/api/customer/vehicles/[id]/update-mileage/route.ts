import { supabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req, context) {
  const { params } = await context;   //  ✅ NEW
  const vehicleId = params.id;        //  ✅ NOW VALID

  const body = await req.json();
  const mileage = Number(body.mileage);

  if (!mileage || mileage <= 0) {
    return NextResponse.json({ ok: false, error: "Invalid mileage" }, { status: 400 });
  }

  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("vehicles")
    .update({ mileage })
    .eq("id", vehicleId);

  if (error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
