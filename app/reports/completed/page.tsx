// app/reports/page.tsx
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

async function resolveCompanyId() {
  const supabase = await supabaseServer();
  try {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id || null;
    if (uid) {
      const { data: prof } = await supabase.from("profiles").select("company_id").eq("id", uid).maybeSingle();
      if (prof?.company_id) return prof.company_id as string;
    }
  } catch {}
  try {
    const { data: v } = await supabase
      .from("vehicles").select("company_id").not("company_id","is",null)
      .order("created_at",{ascending:false}).limit(1).maybeSingle();
    if (v?.company_id) return v.company_id as string;
  } catch {}
  return null;
}

export default async function ReportsPage() {
  const supabase = await supabaseServer();
  const company_id = await resolveCompanyId();
  if (!company_id) return <div className="p-6">No company detected.</div>;

  // counts by status
  const statuses = ["NEW","WAITING_APPROVAL","WAITING_PARTS","DECLINED","SCHEDULED","IN_PROGRESS","COMPLETED"];
  const counts: Record<string, number> = {};
  for (const s of statuses) {
    const { count } = await supabase
      .from("service_requests")
      .select("id", { count: "exact", head: true })
      .eq("company_id", company_id)
      .eq("status", s);
    counts[s] = count ?? 0;
  }

  // recent 20
  const { data: recent } = await supabase
    .from("service_requests")
    .select(`
      id, status, created_at, service, po,
      customer:customer_id ( name ),
      vehicle:vehicle_id ( year, make, model, plate, unit_number )
    `)
    .eq("company_id", company_id)
    .order("created_at",{ascending:false})
    .limit(20);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Reports</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statuses.map((s) => (
          <div key={s} className="rounded border p-4">
            <div className="text-sm text-gray-600">{s}</div>
            <div className="text-2xl font-semibold">{counts[s]}</div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Created</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Customer</th>
              <th className="text-left p-3">Vehicle</th>
              <th className="text-left p-3">Service</th>
              <th className="text-left p-3">PO</th>
            </tr>
          </thead>
          <tbody>
            {(recent ?? []).map((r: any) => {
              const v = r.vehicle || {};
              const veh = [v.year, v.make, v.model, v.plate || v.unit_number].filter(Boolean).join(" ");
              return (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3">{r.status}</td>
                  <td className="p-3">{r.customer?.name ?? "—"}</td>
                  <td className="p-3">{veh || "—"}</td>
                  <td className="p-3">{r.service ?? "—"}</td>
                  <td className="p-3">{r.po ?? "—"}</td>
                </tr>
              );
            })}
            {(recent ?? []).length === 0 && <tr><td colSpan={6} className="p-6 text-center text-gray-500">No data.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
