// app/api/customers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/helpers/resolveUserScope";

export const dynamic = "force-dynamic";

/* ============================================================================
   GET /api/customers/:id
============================================================================ */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const sb = await supabaseServer();
    const { id } = await ctx.params;

    const scope = await resolveUserScope(sb);
    const { role, isSuper, isAdmin, customer_id, markets } = scope;

    // CUSTOMER_USER → can only access their own customer row
    if (role.startsWith("CUSTOMER")) {
      if (customer_id !== id) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }

    // Non-admin internal roles → scope to assigned markets
    if (!isSuper && !isAdmin && !role.startsWith("CUSTOMER")) {
      if (markets.length === 0) {
        return NextResponse.json({ error: "no_market_access" }, { status: 403 });
      }
    }

    // fetch the record
    const { data, error } = await sb
      .from("customers")
      .select("id, name, market, company_id")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });

    // If non-admin internal role → enforce market match
    if (!isSuper && !isAdmin && !role.startsWith("CUSTOMER")) {
      if (!markets.includes(data.market)) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({ customer: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/* ============================================================================
   PATCH /api/customers/:id
   Allowed only for: SUPERADMIN, ADMIN
============================================================================ */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const sb = await supabaseServer();
    const { id } = await ctx.params;
    const scope = await resolveUserScope(sb);

    if (!scope.isSuper && !scope.isAdmin) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, market } = body;

    const updates: any = {};
    if (name) updates.name = String(name).trim();
    if (market) updates.market = market;

    const { data, error } = await sb
      .from("customers")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ customer: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/* ============================================================================
   DELETE /api/customers/:id
   Allowed only for ADMIN + SUPERADMIN
============================================================================ */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const sb = await supabaseServer();
    const { id } = await ctx.params;

    const scope = await resolveUserScope(sb);
    if (!scope.isSuper && !scope.isAdmin) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { error } = await sb
      .from("customers")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
