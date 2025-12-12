import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();
    const body = await req.json();

    const { vehicle_id } = body;
    if (!vehicle_id)
      return NextResponse.json({ error: "Missing vehicle_id" }, { status: 400 });

    // Get customer user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Insert alert into dispatch_notifications
    const { error } = await supabase.from("dispatch_notifications").insert([
      {
        vehicle_id,
        created_by: user.id,
        message: `Customer flagged vehicle ${vehicle_id} for urgent review`,
        status: "NEW",
      },
    ]);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Server error", detail: `${err}` },
      { status: 500 }
    );
  }
}
