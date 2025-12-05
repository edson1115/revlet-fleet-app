// lib/autointegrate/buildDraft.ts
import { supabaseServer } from "@/lib/supabase/server";

export async function buildAutoIntegrateDraft(requestId: string) {
  const supabase = await supabaseServer();

  const { data: r, error } = await supabase
    .from("service_requests")
    .select(`
      *,
      customer:customer_id(name, market),
      vehicle:vehicle_id(year, make, model, plate, unit_number, vin),
      location:location_id(name)
    `)
    .eq("id", requestId)
    .maybeSingle();

  if (error || !r) throw new Error("Request not found");

  const v = r.vehicle?.[0] || r.vehicle || null;
  const c = r.customer?.[0] || r.customer || null;

  const payload = {
    job: {
      id: r.id,
      status: "draft",

      unitNumber: v?.unit_number ?? "",
      licensePlate: v?.plate ?? "",
      vin: v?.vin ?? "",
      mileage: r.mileage ?? "",

      customerName: c?.name ?? "",
      market: c?.market ?? "",
      service: r.service ?? "",
      locationName: r.location?.[0]?.name ?? r.location?.name ?? "",

      notes: r.notes ?? "",
      dispatchNotes: r.dispatch_notes ?? "",
      fmc: r.fmc ?? r.fmc_text ?? "",
      po: r.po ?? "",

      // placeholder service map
      services: mapServiceToAutoIntegrateCode(r.service),

      createdAt: r.created_at,
      preferredWindowStart: r.preferred_window_start,
      preferredWindowEnd: r.preferred_window_end,
    },
  };

  return payload;
}

// --------------------------
// MAP SERVICE TO AI CODES
// --------------------------
function mapServiceToAutoIntegrateCode(serviceName?: string | null) {
  if (!serviceName) return [];

  const s = serviceName.toLowerCase();

  if (s.includes("tire") && s.includes("repair"))
    return [{ code: "TIRE_REPAIR", description: "Tire Repair", hours: 0.5 }];

  if (s.includes("tire") && s.includes("replace"))
    return [{ code: "TIRE_REPLACEMENT", description: "Replace Tire", hours: 0.5 }];

  if (s.includes("battery"))
    return [{ code: "BATTERY", description: "Battery Replacement", hours: 0.7 }];

  if (s.includes("pm") || s.includes("oil"))
    return [{ code: "PM_SERVICE", description: "Preventative Maintenance", hours: 1 }];

  if (s.includes("brake"))
    return [{ code: "BRAKES", description: "Brake Service", hours: 1.2 }];

  if (s.includes("diag") || s.includes("check engine"))
    return [{ code: "DIAGNOSTIC", description: "Diagnostic Inspection", hours: 1 }];

  // fallback
  return [{ code: "GENERAL", description: serviceName, hours: 1 }];
}



