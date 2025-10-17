// app/admin/page.tsx
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

async function resolveCompanyId() {
  const supabase = await supabaseServer();
  try {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id || null;
    if (uid) {
      const { data: prof, error } = await supabase.from("profiles").select("company_id").eq("id", uid).maybeSingle();
      if (!error && prof?.company_id) return prof.company_id as string;
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

export default async function AdminPage({ searchParams }: { searchParams?: Record<string,string> }) {
  const supabase = await supabaseServer();
  const company_id = await resolveCompanyId();
  if (!company_id) return <div className="p-6">No company detected.</div>;

  const status = searchParams?.status ?? "ALL";
  const market = searchParams?.market ?? "ALL";

  // Markets from company_customers
  const { data: marketsData } = await supabase
    .from("company_customers")
    .select("market")
    .eq("company_id", company_id)
    .not("market","is",null);
  const markets = Array.from(new Set((marketsData ?? []).map((x:any)=>x.market))).sort();

  // Base query
  let q = supabase
    .from("service_requests")
    .select(`
      id, status, created_at, service, po, notes,
      customer:customer_id ( name, market ),
      vehicle:vehicle_id ( year, make, model, plate, unit_number )
    `)
    .eq("company_id", company_id)
    .order("created_at", { ascending: false });

  if (status !== "ALL") q = q.eq("status", status);
  if (market !== "ALL") {
    // filter by customer.market value
    // PostgREST doesn't filter joined columns directly, so fetch ids of customers in that market
    const { data: custs } = await supabase
      .from("company_customers")
      .select("id")
      .eq("company_id", company_id)
      .eq("market", market);
    const ids = (custs ?? []).map((c:any)=>c.id);
    if (ids.length > 0) q = q.in("customer_id", ids);
    else q = q.in("customer_id", ["00000000-0000-0000-0000-000000000000"]); // no results
  }

  const { data: rows } = await q;

  const statuses = ["ALL","NEW","WAITING_APPROVAL","WAITING_PARTS","DECLINED","SCHEDULED","IN_PROGRESS","COMPLETED"];

  function urlFor(s: string, m: string) {
    const u = new URL("http://dummy/admin");
    if (s) u.searchParams.set("status", s);
    if (m) u.searchParams.set("market", m);
    return `/admin?${u.searchParams.toString()}`;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Admin</h1>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Status:</span>
          <div className="flex gap-2 flex-wrap">
            {statuses.map((s) => (
              <a key={s} href={urlFor(s, market)}
                 className={`px-2 py-1 rounded border text-sm ${status===s ? "bg-black text-white" : ""}`}>
                {s}
              </a>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Market:</span>
          <a href={urlFor(status, "ALL")} className={`px-2 py-1 rounded border text-sm ${market==="ALL"?"bg-black text-white":""}`}>ALL</a>
          {markets.map((m) => (
            <a key={m} href={urlFor(status, m)}
               className={`px-2 py-1 rounded border text-sm ${market===m?"bg-black text-white":""}`}>
              {m}
            </a>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Created</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Customer</th>
              <th className="text-left p-3">Market</th>
              <th className="text-left p-3">Vehicle</th>
              <th className="text-left p-3">Service</th>
              <th className="text-left p-3">PO</th>
              <th className="text-left p-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((r:any) => {
              const v = r.vehicle || {};
              const veh = [v.year, v.make, v.model, v.plate || v.unit_number].filter(Boolean).join(" ");
              const notesShort = (r.notes ?? "").length > 60 ? r.notes.slice(0,60)+"…" : (r.notes ?? "—");
              return (
                <tr key={r.id} className="border-t align-top">
                  <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3">{r.status}</td>
                  <td className="p-3">{r.customer?.name ?? "—"}</td>
                  <td className="p-3">{r.customer?.market ?? "—"}</td>
                  <td className="p-3">{veh || "—"}</td>
                  <td className="p-3">{r.service ?? "—"}</td>
                  <td className="p-3">{r.po ?? "—"}</td>
                  <td className="p-3 max-w-[320px]">{notesShort}</td>
                </tr>
              );
            })}
            {(rows ?? []).length === 0 && <tr><td colSpan={8} className="p-6 text-center text-gray-500">No results.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
