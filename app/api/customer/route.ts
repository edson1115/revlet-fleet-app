// app/api/customers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/helpers/resolveUserScope";

export const dynamic = "force-dynamic";

/* ============================================================================
   GET /api/customers
   - SUPERADMIN → all customers
   - ADMIN → customers in their markets
   - OFFICE → customers in their markets
   - DISPATCH → customers in their markets
   - TECH → customers in their markets
   - CUSTOMER_USER → their own customer record only
============================================================================ */

export async function GET(req: NextRequest) {
  try {
    const sb = await supabaseServer();
    const scope = await resolveUserScope(sb);

    const { role, isSuper, isAdmin, customer_id, markets } = scope;

    let q = sb
      .from("customers")
      .select("id, name, market, company_id")
      .order("name", { ascending: true });

    // CUSTOMER_USER → can only see their own account
    if (role.startsWith("CUSTOMER")) {
      if (!customer_id)
        return NextResponse.json({ rows: [] });

      q = q.eq("id", customer_id);
    }
    // SUPERADMIN → no filter
    else if (isSuper) {
      // no filter
    }
    // ADMIN / OFFICE / DISPATCH / TECH → filter by assigned markets
    else {
      if (markets.length === 0)
        return NextResponse.json({ rows: [] });

      q = q.in("market", markets);
    }

    const { data, error } = await q;
    if (error) throw error;

    return NextResponse.json({ rows: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/* ============================================================================
   POST /api/customers
   Allowed: SUPERADMIN + ADMIN only
============================================================================ */

export async function POST(req: NextRequest) {
  try {
    const sb = await supabaseServer();
    const scope = await resolveUserScope(sb);

    if (!scope.isSuper && !scope.isAdmin) {
      return NextResponse.json(
        { error: "forbidden" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { name, market, company_id } = body;

    if (!name || !market) {
      return NextResponse.json(
        { error: "name_and_market_required" },
        { status: 400 }
      );
    }

    const { data, error } = await sb
      .from("customers")
      .insert({
        name: String(name).trim(),
        market,
        company_id: company_id ?? scope.company_id ?? null,
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ customer: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/* ============================================================================
   PATCH /api/customers
   Allowed: SUPERADMIN + ADMIN only
============================================================================ */

export async function PATCH(req: NextRequest) {
  try {
    const sb = await supabaseServer();
    const scope = await resolveUserScope(sb);

    if (!scope.isSuper && !scope.isAdmin) {
      return NextResponse.json(
        { error: "forbidden" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { id, name, market } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id_required" },
        { status: 400 }
      );
    }

    const update: any = {};
    if (name) update.name = String(name).trim();
    if (market) update.market = market;

    const { data, error } = await sb
      .from("customers")
      .update(update)
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
   DELETE /api/customers?id=<uuid>
   Allowed: SUPERADMIN + ADMIN only
============================================================================ */

export async function DELETE(req: NextRequest) {
  try {
    const sb = await supabaseServer();
    const scope = await resolveUserScope(sb);

    if (!scope.isSuper && !scope.isAdmin) {
      return NextResponse.json(
        { error: "forbidden" },
        { status: 403 }
      );
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "id_required" },
        { status: 400 }
      );
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
