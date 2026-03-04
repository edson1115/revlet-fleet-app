import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServerRoute } from "@/lib/supabase/server-route";
import { calculateVehicleRisk } from "@/lib/intelligence";

export const dynamic = "force-dynamic";

function isAllowedRole(role?: string) {
  return (
    role === "SUPERADMIN" ||
    role === "ADMIN" ||
    role === "DISPATCH" ||
    role === "DISPATCHER" ||
    role === "OFFICE"
  );
}

export async function GET() {
  // ✅ Auth via SSR client (cookie-aware)
  const supabaseAuth = await supabaseServerRoute();
  const {
    data: { user },
    error: userErr,
  } = await supabaseAuth.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (user.user_metadata?.role as string | undefined) ?? undefined;
  if (!isAllowedRole(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ✅ Service role client for data reads
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  /**
   * IMPORTANT:
   * Your current DB schema does NOT have vehicles.license_plate and vehicles.mileage
   * (and your logs show it throwing 42703 errors).
   *
   * So we ONLY select columns we can safely rely on:
   * - vehicles: id, vin, make, model, year
   *
   * But we still return license_plate / mileage fields as `null`
   * so the UI that expects them doesn't break.
   */
  const { data, error } = await supabase
    .from("service_requests")
    .select(
      `
        id,
        created_at,
        status,
        priority,
        scheduled_start,
        scheduled_end,
        description,
        customer_id,
        vehicle_id,
        customers:customers(id, name),
        vehicles:vehicles(
          id,
          vin,
          make,
          model,
          year
        )
      `
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Dispatch API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const requests =
    (data ?? []).map((r: any) => {
      const v = r?.vehicles ?? {};

      // Provide schema-safe defaults (so UI doesn't break)
      const mileage = null;
      const last_service_miles = null;
      const last_service_date = null;
      const license_plate = null;

      const risk = calculateVehicleRisk({
        mileage: 0,
        lastServiceMiles: 0,
        lastServiceDate: "",
      });

      return {
        ...r,
        vehicles: {
          ...v,
          mileage,
          last_service_miles,
          last_service_date,
          license_plate,
        },
        riskScore: risk.score,
        recommendation: risk.recommendation,
      };
    }) ?? [];

  // ✅ Keep the exact response shape your dashboard expects
  return NextResponse.json({ requests });
}