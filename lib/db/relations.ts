// lib/db/relations.ts
import { supabaseServer } from "@/lib/supabase/server";

export type RelationMaps = {
  customers: Record<string, any>;
  vehicles: Record<string, any>;
  locations: Record<string, any>;
  technicians: Record<string, any>;
};

export async function loadRelations(requests: any[]): Promise<RelationMaps> {
  const sb = await supabaseServer();

  const customerIds = [...new Set(requests.map(r => r.customer_id).filter(Boolean))];
  const vehicleIds = [...new Set(requests.map(r => r.vehicle_id).filter(Boolean))];
  const locationIds = [...new Set(requests.map(r => r.location_id).filter(Boolean))];
  const techIds = [...new Set(requests.map(r => r.technician_id).filter(Boolean))];

  const customers: Record<string, any> = {};
  const vehicles: Record<string, any> = {};
  const locations: Record<string, any> = {};
  const technicians: Record<string, any> = {};

  if (customerIds.length) {
    const { data } = await sb
      .from("customers")
      .select("id, name, market")
      .in("id", customerIds);
    (data ?? []).forEach(c => (customers[c.id] = c));
  }

  if (vehicleIds.length) {
    const { data } = await sb
      .from("vehicles")
      .select("id, year, make, model, plate, unit_number, customer_id")
      .in("id", vehicleIds);
    (data ?? []).forEach(v => (vehicles[v.id] = v));
  }

  if (locationIds.length) {
    const { data } = await sb
      .from("locations")
      .select("id, name, market")
      .in("id", locationIds);
    (data ?? []).forEach(l => (locations[l.id] = l));
  }

  if (techIds.length) {
    const { data } = await sb
      .from("technicians")
      .select("id, full_name, company_id")
      .in("id", techIds);
    (data ?? []).forEach(t => (technicians[t.id] = t));
  }

  return { customers, vehicles, locations, technicians };
}



