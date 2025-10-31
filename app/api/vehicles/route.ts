// app/api/vehicles/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

// single place to figure out who we are
async function getCurrentUserContext() {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, company_id: null, role: null, isSuper: false };
  }

  const authUid = user.id;

  // try newer app_users
  let appUser: { company_id: string | null; role: string | null } | null = null;
  try {
    const { data } = await supabase
      .from("app_users")
      .select("company_id, role")
      .eq("auth_uid", authUid)
      .maybeSingle();
    if (data) {
      appUser = {
        company_id: (data as any).company_id ?? null,
        role: (data as any).role ?? null,
      };
    }
  } catch {
    // ignore
  }

  // try legacy profiles
  let profile: { company_id: string | null } | null = null;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", authUid)
      .maybeSingle();
    if (data) {
      profile = { company_id: (data as any).company_id ?? null };
    }
  } catch {
    // ignore
  }

  const role = appUser?.role ?? null;
  const isSuper = role === "SUPERADMIN" || role === "ADMIN";
  const company_id = appUser?.company_id ?? profile?.company_id ?? null;

  return { user, company_id, role, isSuper };
}

const SELECT_COLS =
  "id, company_id, location_id, unit_number, plate, year, make, model, vin, notes, active, is_active, created_at";

/**
 * GET /api/vehicles
 * GET /api/vehicles?customer_id=...
 */
export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const url = new URL(req.url);
  const customer_id = url.searchParams.get("customer_id") || undefined;
  const debug = url.searchParams.get("debug") === "1";

  const { user, company_id, isSuper, role } = await getCurrentUserContext();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    // SUPERADMIN — show all, optionally filtered by join
    if (isSuper) {
      if (customer_id) {
        // look in join table first
        const join = await supabase
          .from("company_customer_vehicles")
          .select("vehicle_id, company_id")
          .eq("customer_id", customer_id);

        if (!join.error && (join.data?.length ?? 0) > 0) {
          const ids = join.data.map((r: any) => r.vehicle_id);
          let byIds = await supabase.from("vehicles").select(SELECT_COLS).in("id", ids);
          if (byIds.error) {
            byIds = await supabase.from("vehicles").select("*").in("id", ids);
          }
          return NextResponse.json(byIds.data ?? []);
        }

        // nothing in join → just return all
        let all = await supabase.from("vehicles").select(SELECT_COLS);
        if (all.error) {
          all = await supabase.from("vehicles").select("*");
        }
        return NextResponse.json(all.data ?? []);
      }

      // no customer_id
      let all = await supabase.from("vehicles").select(SELECT_COLS);
      if (all.error) {
        all = await supabase.from("vehicles").select("*");
      }
      return NextResponse.json(all.data ?? []);
    }

    // NON SUPER → needs company
    if (!company_id) {
      return NextResponse.json(
        debug
          ? {
              error: "no_company",
              hint: "profiles/app_users has no company_id for this user",
              role,
            }
          : { error: "no_company" },
        { status: 400 }
      );
    }

    // If no customer_id → normal company vehicles
    if (!customer_id) {
      let res = await supabase.from("vehicles").select(SELECT_COLS).eq("company_id", company_id);
      if (res.error) {
        res = await supabase.from("vehicles").select("*").eq("company_id", company_id);
      }
      if (res.error) throw res.error;
      return NextResponse.json(res.data ?? []);
    }

    // If customer_id IS present →
    // 1) look in join table
    const join = await supabase
      .from("company_customer_vehicles")
      .select("vehicle_id")
      .eq("company_id", company_id)
      .eq("customer_id", customer_id);

    if (!join.error && (join.data?.length ?? 0) > 0) {
      const ids = join.data.map((r: any) => r.vehicle_id);
      let byIds = await supabase
        .from("vehicles")
        .select(SELECT_COLS)
        .eq("company_id", company_id)
        .in("id", ids);
      if (byIds.error) {
        byIds = await supabase
          .from("vehicles")
          .select("*")
          .eq("company_id", company_id)
          .in("id", ids);
      }
      if (byIds.error) throw byIds.error;
      return NextResponse.json(byIds.data ?? []);
    }

    // 2) no customer-linked vehicles → give company vehicles so UI isn't empty
    let fallback = await supabase.from("vehicles").select(SELECT_COLS).eq("company_id", company_id);
    if (fallback.error) {
      fallback = await supabase.from("vehicles").select("*").eq("company_id", company_id);
    }

    if (debug) {
      return NextResponse.json({
        via: "no-customer-link → returning company vehicles",
        customer_id,
        company_id,
        rows: fallback.data ?? [],
      });
    }

    return NextResponse.json(fallback.data ?? []);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}

/**
 * POST /api/vehicles
 *
 * IMPORTANT: your vehicles table does NOT have customer_id
 * so we WILL NOT insert customer_id into vehicles.
 * Instead, we'll link in company_customer_vehicles if customer_id was provided.
 */
export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { user, company_id: ctxCompanyId, isSuper } = await getCurrentUserContext();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    company_id: bodyCompanyId = null,
    customer_id = null, // we'll use this ONLY for link table
    location_id = null,
    unit_number,
    plate = null,
    year = null,
    make = null,
    model = null,
    vin = null,
    notes = null,
  } = body ?? {};

  // super can override company_id in body, normal user can't
  const company_id = isSuper ? bodyCompanyId ?? ctxCompanyId : ctxCompanyId;

  if (!company_id) {
    return NextResponse.json({ error: "no_company" }, { status: 400 });
  }

  // ⬇️ THIS is the change: unit_number is now OPTIONAL
  const cleanUnit = unit_number ? String(unit_number).trim() : null;
  const hasUnit = !!cleanUnit;

  // Base payload
  const insertPayload: Record<string, any> = {
    company_id,
    location_id,
    unit_number: hasUnit ? cleanUnit : null,
    plate,
    year,
    make,
    model,
    vin,
    notes,
    active: true,
    is_active: true,
  };

  try {
    let ins;

    if (hasUnit) {
      // if we DO have a unit_number, we keep your previous behavior:
      // try to insert, but if duplicate, return existing
      ins = await supabase.from("vehicles").insert(insertPayload).select(SELECT_COLS).single();

      if (ins.error) {
        const msg = ins.error.message || "";
        if (msg.includes("duplicate") || msg.includes("already exists")) {
          const existing = await supabase
            .from("vehicles")
            .select(SELECT_COLS)
            .eq("company_id", company_id)
            .eq("unit_number", cleanUnit)
            .maybeSingle();
          if (!existing.error && existing.data) {
            // link to customer if needed
            if (customer_id) {
              try {
                await supabase.from("company_customer_vehicles").insert([
                  {
                    company_id,
                    customer_id,
                    vehicle_id: existing.data.id,
                  },
                ]);
              } catch {
                // ignore
              }
            }
            return NextResponse.json(existing.data, { status: 200 });
          }
        }

        return NextResponse.json({ error: ins.error.message }, { status: 500 });
      }
    } else {
      // NO unit_number: just insert a row with null unit
      ins = await supabase.from("vehicles").insert(insertPayload).select(SELECT_COLS).single();
      if (ins.error) {
        return NextResponse.json({ error: ins.error.message }, { status: 500 });
      }
    }

    const newVehicle = ins.data;

    // link to customer if we got one
    if (customer_id && newVehicle?.id) {
      try {
        await supabase.from("company_customer_vehicles").insert([
          {
            company_id,
            customer_id,
            vehicle_id: newVehicle.id,
          },
        ]);
      } catch {
        // table might not exist — that's ok
      }
    }

    return NextResponse.json(newVehicle, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
