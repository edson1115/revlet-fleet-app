import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { ticket_id, key_location } = await req.json();

  // 1. Flip status to SCHEDULED (Now the Tech can see it)
  // 2. Save the Key Location info
  const { error } = await supabase
    .from("service_requests")
    .update({
        status: "SCHEDULED",
        key_location: key_location,
        updated_at: new Date().toISOString()
    })
    .eq("id", ticket_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}