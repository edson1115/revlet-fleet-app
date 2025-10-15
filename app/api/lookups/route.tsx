// app/api/lookups/route.ts
import { getSupabase, json, onError, requireRole } from '@/lib/auth/requireRole';

export async function GET() {
  try {
    const meta = await requireRole(['ADMIN', 'OFFICE', 'DISPATCH', 'TECH', 'CUSTOMER']);
    const supabase = await getSupabase();

    const [vehicles, locations, customers] = await Promise.all([
      supabase
        .from('vehicles')
        .select('id, year, make, model, unit_number')
        .eq('company_id', meta.company_id)
        .order('created_at', { ascending: false })
        .limit(500),
      supabase
        .from('locations')
        .select('id, name')
        .eq('company_id', meta.company_id)
        .order('name', { ascending: true }),
      supabase
        .from('customers')
        .select('id, name')
        .eq('company_id', meta.company_id)
        .order('name', { ascending: true }),
    ]);

    return json({
      vehicles: vehicles.data ?? [],
      locations: locations.data ?? [],
      customers: customers.data ?? [],
    });
  } catch (e) {
    return onError(e);
  }
}
