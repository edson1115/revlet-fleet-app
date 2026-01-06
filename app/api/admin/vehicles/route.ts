import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customer_id");

    if (!customerId) {
        return NextResponse.json({ ok: true, rows: [] });
    }

    const supabase = await supabaseServer();

    const { data: vehicles, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("customer_id", customerId)
      .order("year", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ ok: true, rows: vehicles });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}