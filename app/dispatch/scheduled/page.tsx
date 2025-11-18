import { supabaseServer } from "@/lib/supabase/server";
import { markInProgressAction } from "./actions";

export const dynamic = "force-dynamic";

async function resolveCompanyId() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const uid = data?.user?.id;
  if (!uid) return null;

  const { data: prof } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", uid)
    .maybeSingle();

  return prof?.company_id ?? null;
}

export default async function DispatchScheduledPage() {
  const supabase = await supabaseServer();
  const company_id = await resolveCompanyId();
  if (!company_id) return <div className="p-6">No company detected.</div>;

  const { data: rows, error } = await supabase
    .from("service_requests")
    .select(`
      id, created_at, status, service, po, notes,
      vehicle:vehicle_id ( year, make, model, plate, unit_number ),
      customer:customer_id ( name )
    `)
    .eq("company_id", company_id)
    .eq("status", "SCHEDULED")
    .order("created_at", { ascending: true });

  if (error) return <div className="p-6">Failed to load dispatch queue.</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Dispatch — SCHEDULED</h1>

      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm align-top">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Created</th>
              <th className="text-left p-3">Vehicle</th>
              <th className="text-left p-3">Customer</th>
              <th className="text-left p-3">Service</th>
              <th className="text-left p-3">PO</th>
              <th className="text-left p-3">Notes</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {(rows ?? []).map((r: any) => {
              const v = Array.isArray(r.vehicle) ? r.vehicle[0] : r.vehicle ?? null;
              const c = Array.isArray(r.customer) ? r.customer[0] : r.customer ?? null;

              const vehicle =
                [
                  v?.year,
                  v?.make,
                  v?.model,
                  v?.plate || v?.unit_number,
                ]
                  .filter(Boolean)
                  .join(" ") || "—";

              const customer = c?.name || "—";

              return (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>

                  {/* FIXED → vehicle string instead of invalid vehicleLabel */}
                  <td className="p-3">{vehicle}</td>

                  <td className="p-3">{customer}</td>
                  <td className="p-3">{r.service || "—"}</td>
                  <td className="p-3">{r.po || "—"}</td>

                  <td
                    className="p-3 max-w-[320px] truncate"
                    title={r.notes || ""}
                  >
                    {r.notes || "—"}
                  </td>

                  <td className="p-3">
                    <span className="inline-block rounded-full text-xs px-2 py-1 bg-yellow-50 border border-yellow-200">
                      {r.status}
                    </span>
                  </td>

                  <td className="p-3 text-right space-x-2">
                    <a
                      href={`/dispatch/assign?id=${encodeURIComponent(r.id)}`}
                      className="px-3 py-1 rounded border hover:bg-gray-50 inline-block"
                    >
                      Assign / Edit
                    </a>

                    <form action={markInProgressAction} className="inline-block">
                      <input type="hidden" name="id" value={r.id} />
                      <button className="px-3 py-1 rounded bg-black text-white hover:opacity-80">
                        Mark In Progress
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}

            {(rows ?? []).length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500">
                  No scheduled items.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
