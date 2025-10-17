// app/api/admin/markets/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  try {
    const body = await req.json();

    // Reorder batch: newOrder = [{id, order_index}]
    if (body?.reorder && Array.isArray(body?.newOrder)) {
      const updates = body.newOrder as Array<{ id: string; order_index: number }>;
      for (const row of updates) {
        const { error } = await supabaseAdmin
          .from("company_locations")
          .update({ order_index: row.order_index })
          .eq("id", row.id);
        if (error) throw error;
      }
      return NextResponse.json({ ok: true });
    }

    // Rename
    if (typeof body?.name === "string") {
      const { data, error } = await supabaseAdmin
        .from("company_locations")
        .update({ name: body.name })
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;

      // Optional: cascade rename onto existing customers.market that match the old name
      // NOTE: we can't know the old name here easily; keeping simple to avoid surprise rewrites.
      return NextResponse.json({ market: data });
    }

    return NextResponse.json({ error: "No valid PATCH operation" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to update market" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  try {
    // Clear customer.market if pointing to this market name
    // First read the market name
    const { data: market, error: readErr } = await supabaseAdmin
      .from("company_locations")
      .select("name")
      .eq("id", id)
      .single();
    if (readErr) throw readErr;
    const marketName = market?.name as string | null;

    // Null out any customers with that market
    if (marketName) {
      const { error: clearErr } = await supabaseAdmin
        .from("company_customers")
        .update({ market: null })
        .eq("market", marketName);
      if (clearErr) throw clearErr;
    }

    // Delete the market
    const { error } = await supabaseAdmin.from("company_locations").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to delete market" }, { status: 500 });
  }
}
