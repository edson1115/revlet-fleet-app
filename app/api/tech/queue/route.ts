import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await supabaseServer();

    // 1. Get Current User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    // 2. Fetch Requests for the Tech Queue
    // (Fetches all jobs that are In Progress)
    const { data: requests, error } = await supabase
      .from("service_requests")
      .select(`
        *,
        vehicle:vehicles (*),
        customer:customers (*)
      `)
      .eq("status", "IN_PROGRESS")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ ok: true, queue: requests || [] });

  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}