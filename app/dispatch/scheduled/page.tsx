// app/dispatch/scheduled/page.tsx
import { supabaseServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function resolveCompanyId() {
  const supabase = await supabaseServer();
  try {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id || null;
    if (uid) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", uid)
        .maybeSingle();
      if (prof?.company_id) return prof.company_id as string;
    }
  } catch {}
  return null;
}

/** Server action: move a scheduled job to IN_PROGRESS and stamp started_at */
export async function markInProgressAction(fd: FormData) {
  "use server";
  const id = String(fd.get("id") || "");
  if (!id) throw new Error("Missing id");

  const supabase = await supabaseServer();
  const company_id = await resolveCompanyId();
  if (!company_id) throw new Error("Missing company");

  const { error } = await supabase
    .from("service_requests")
    .update({ status: "IN_PROGRESS", started_at: new Date().toISOString() })
    .eq("id", id)
    .eq("company_id", company_id);

  if (error) throw new Error(error.message);
  revalidatePath("/dispatch/scheduled");
}

export default async function DispatchScheduledPage() {
  const supabase = await supabaseServer();
  const company_id = await resolveCompanyId();
  if (!company_id) return <div className="p-6">No company detected.</div>;

  // Show all SCHEDULED jobs for this company
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
              const v = r.vehicle || {};
              const vehicleLabel = [v.year, v.make, v.model, v.plate || v.unit_number]
                .filter(Boolean)
                .join(" ");
              return (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3">{vehicleLabel || "—"}</td>
                  <td className="p-3">{r.customer?.name ?? "—"}</td>
                  <td className="p-3">{r.service || "—"}</td>
                  <td className="p-3">{r.po || "—"}</td>
                  <td className="p-3 max-w-[320px] truncate" title={r.notes || ""}>
                    {r.notes || "—"}
                  </td>
                  <td className="p-3">
                    <span className="inline-block rounded-full text-xs px-2 py-1 bg-yellow-50 border border-yellow-200">
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    {/* Assign / Edit opens the date/time + tech picker */}
                    <a
                      href={`/dispatch/assign?id=${encodeURIComponent(r.id)}`}
                      className="px-3 py-1 rounded border hover:bg-gray-50 inline-block"
                      title="Set date/time and assign technicians"
                    >
                      Assign / Edit
                    </a>

                    {/* Mark job as In Progress */}
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
