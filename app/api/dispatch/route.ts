import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { calculateVehicleRisk } from "@/lib/intelligence";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // app/api/dispatch/route.ts

// 1. Change the filter to use a valid Uppercase Enum value
const { data: requests, error } = await supabaseAdmin
  .from("service_requests")
  .select(`
    id,
    status,
    service_title,
    customer_id,
    created_at,
    vehicles (
      id,
      make,
      model,
      year,
      mileage,
      last_service_miles,
      last_service_date
    )
  `)
  .eq("status", "NEW") // Must match: NEW, SCHEDULED, or COMPLETED exactly
  .order("created_at", { ascending: false });

    if (error) throw error;

    // 2. Map through requests and inject Fleet Brain intelligence
    const scoredRequests = (requests || []).map((req: any) => {
      const vehicle = req.vehicles;
      
      // Calculate risk based on blueprint signals: mileage delta and time
      const risk = calculateVehicleRisk(
        vehicle?.mileage || 0,
        vehicle?.last_service_miles || 0,
        vehicle?.last_service_date || new Date().toISOString()
      );

      return {
        ...req,
        intelligence: {
          risk_score: risk.score,
          risk_level: risk.level,
          insight: risk.label,
          // Placeholder for Phase 2: Tech Match Score
          suggested_priority: risk.level === 'HIGH' ? 1 : 2 
        }
      };
    });

    return NextResponse.json({ requests: scoredRequests });
  } catch (error: any) {
    console.error("Dispatch API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}