import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await supabaseServer();

    const {
      make,
      model,
      year,
      unit_number,
      plate,
      group_name,
    } = body;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.customer_id) {
      return NextResponse.json({ error: "No customer profile" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("vehicles")
      .insert([{
        make,
        model,
        year,
        unit_number,
        plate,
        customer_id: profile.customer_id,
        group_name: group_name || null,
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, vehicle: data });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
