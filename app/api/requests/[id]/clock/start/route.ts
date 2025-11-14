import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function PATCH(req, { params }) {
  const id = params.id;
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("service_requests")
    .update({
      started_at: new Date().toISOString(),
      status: "IN_PROGRESS",
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
