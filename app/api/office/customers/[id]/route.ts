import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("Customer API: no session");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: customer, error } = await supabase
    .from("customers")
    .select("id, name, market")
    .eq("id", id)
    .single();

  if (error || !customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ customer });
}
