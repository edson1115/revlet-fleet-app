// app/api/vehicles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { resolveUserScope } from "@/lib/auth/scope";
import { loadVehicleRelations } from "@/lib/db/relations";

export const dynamic = "force-dynamic";

/* ============================================
   GET /api/vehicles
   Supports:
   - ?customer_id=<uuid>
   - ?market=<MARKET_NAME>
   - Automatically scopes by role + markets
   ============================================ */
export async function GET(req: NextRequest) {
  try {
    const scope = await resolveUserScope();
    if (!scope.uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const sb = await supabaseServer();
    const url = new URL(req.url);

    const filterCustomer = url.searchParams.get("customer_id");
    const filterMarket = url.searchParams.get("market");

    let q = sb
      .from("vehicles")
      .select("id, customer_id, unit_number, make, model, year, plate, vin, created_at")
      .order("unit_number", { ascending: true });

    /* ======================
       PER-ROLE VISIBILITY
       ====================== */

    // SUPERADMIN → sees everything
    if (scope.isSuper) {
      if (filterCustomer) q = q.eq("customer_id", filterCustomer);
      return await finish();
    }

    // CUSTOMER_USER → only their own vehicles
    if (scope.isCustomer) {
      if (!scope.customer_id)
        return NextResponse.json({ rows: [] });

      q = q.eq("customer_id", scope.customer_id);
      return await finish();
    }

    // TECH → only vehicles in their markets
    if (scope.role === "TECH") {
      if (!scope.markets.size) return NextResponse.json({ rows: [] });

      q = q.in("market", Array.from(scope.markets));
      return await finish();
    }

    // OFFICE / DISPATCH / ADMIN → vehicles for customers in their markets
    if (scope.markets.size) {
      q = q.in("market", Array.from(scope.markets));
    } else {
      return NextResponse.json({ rows: [] });
    }

    if (filterCustomer) q = q.eq("customer_id", filterCustomer);

    return await finish();

    /* ===============================
       Finish (load relations → return)
       =============================== */
    async function finish() {
      const { data, error } = await q;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      const rows = data ?? [];
      if (!rows.length) return NextResponse.json({ rows: [] });

      const rel = await loadVehicleRelations(rows);

      const ui = rows.map((v) => ({
        ...v,
        customer: rel.customers[v.customer_id] ?? null,
        market: v.market ?? rel.customerMarkets[v.customer_id] ?? null,
      }));

      return NextResponse.json({ rows: ui });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/* ============================================
   POST /api/vehicles  
   Internal roles + Customers can add vehicles
   ============================================ */
export async function POST(req: NextRequest) {
  try {
    const scope = await resolveUserScope();
    if (!scope.uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    const { customer_id, unit_number, make, model, year, plate, vin, market } = body;

    if (!unit_number) {
      return NextResponse.json({ error: "missing_unit_number" }, { status: 400 });
    }

    const sb = await supabaseServer();

    /* ======================
       CUSTOMER-USER logic
       ====================== */
    if (scope.isCustomer) {
      if (!scope.customer_id)
        return NextResponse.json({ error: "no_customer_context" }, { status: 400 });

      // Force vehicle to belong to their own account
      const { data, error } = await sb
        .from("vehicles")
        .insert({
          customer_id: scope.customer_id,
          unit_number,
          make,
          model,
          year,
          plate,
          vin,
          market: scope.customer_market,
        })
        .select("*")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json(data);
    }

    /* ======================
       OFFICE / DISPATCH / ADMIN
       Must assign to customers in their market
       ====================== */
    if (
      scope.role === "OFFICE" ||
      scope.role === "DISPATCH" ||
      scope.role === "ADMIN"
    ) {
      if (!customer_id)
        return NextResponse.json({ error: "customer_required" }, { status: 400 });

      // check customer belongs to one of office's markets
      const { data: customer } = await sb
        .from("customers")
        .select("id, market")
        .eq("id", customer_id)
        .maybeSingle();

      if (!customer || !scope.markets.has(customer.market)) {
        return NextResponse.json({ error: "forbidden_customer_market" }, { status: 403 });
      }

      const { data, error } = await sb
        .from("vehicles")
        .insert({
          customer_id,
          unit_number,
          make,
          model,
          year,
          plate,
          vin,
          market: customer.market,
        })
        .select("*")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json(data);
    }

    /* ======================
       SUPERADMIN → full power
       ====================== */
    if (scope.isSuper) {
      const { data, error } = await sb
        .from("vehicles")
        .insert({
          customer_id,
          unit_number,
          make,
          model,
          year,
          plate,
          vin,
          market,
        })
        .select("*")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/* ============================================
   PATCH /api/vehicles  (id passed in body)
   Office + Admin + Superadmin only
   ============================================ */
export async function PATCH(req: NextRequest) {
  try {
    const scope = await resolveUserScope();
    if (!scope.uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    if (!(scope.isSuper || scope.role === "ADMIN" || scope.role === "OFFICE")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

    const sb = await supabaseServer();

    const allowed = ["unit_number", "make", "model", "year", "plate", "vin"];
    const update: any = {};
    for (const key of allowed) {
      if (fields[key] !== undefined) update[key] = fields[key];
    }

    const { data, error } = await sb
      .from("vehicles")
      .update(update)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/* ============================================
   DELETE /api/vehicles?id=<uuid>
   Admin + Superadmin only
   ============================================ */
export async function DELETE(req: NextRequest) {
  try {
    const scope = await resolveUserScope();
    if (!scope.isSuper && scope.role !== "ADMIN") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

    const sb = await supabaseServer();
    const { error } = await sb.from("vehicles").delete().eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
