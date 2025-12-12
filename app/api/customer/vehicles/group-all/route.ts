import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();

  // Get current user's customer_id
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.customer_id) {
    return NextResponse.json({ error: "Invalid profile" }, { status: 403 });
  }

  // Load all vehicles
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .eq("customer_id", profile.customer_id);

  if (!vehicles) {
    return NextResponse.json({ error: "No vehicles" }, { status: 404 });
  }

  // Call AI for each
  for (const v of vehicles) {
    const ai = await fetch(process.env.NEXT_PUBLIC_SITE_URL + "/api/ai/vehicles/group", {
      method: "POST",
      body: JSON.stringify(v),
      headers: { "Content-Type": "application/json" },
    });

    const js = await ai.json();
    if (js.group) {
      await supabase
        .from("vehicles")
        .update({ group_name: js.group })
        .eq("id", v.id);
    }
  }

  return NextResponse.json({ ok: true });
}
