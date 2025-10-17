// app/dispatch/scheduled/page.tsx
import { supabaseServer } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function resolveCompanyId() {
  const supabase = await supabaseServer();
  try {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id || null;
    if (uid) {
      const { data: prof, error } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", uid)
        .maybeSingle();
      if (!error && prof?.company_id) return prof.company_id as string;
    }
  } catch {}
  try {
    const { data: v } = await supabase
      .from("vehicles")
      .select("company_id")
      .not("company_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (v?.company_id) return v.company_id as string;
  } catch {}
  return null;
}

export async function startAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  const supabase = await supabaseServer();
  const company_id = await resolveCompanyId();
  const { error } = await supabase
    .from("service_requests")
    .update({ status: "IN_PROGRESS", started_at: new Date().toISOString() })
    .eq("id", id).eq("company_id", company_id!);
  if (error) throw new Error(error.message);
  revalidatePath("/dispatch/scheduled");
}

export default async function DispatchScheduledPage() {
  const supabase = await supabaseServer();
  const company_id = await resolveCompanyId();
  if (!company_id) return <div className="p-6">No company.</div>;

  const { data: rows } = await supabase
    .from("service_requests")
    .select(`
      id, created_at, status, service, fmc, mileage, po, notes,
      vehicle:vehicle_id ( year, make, model, plate, unit_number ),
      customer:customer_id ( name )
    `)
    .eq("company_id", company_id)
    .eq("status", "SCHEDULED")
    .order("scheduled_at", { ascending: true }).order("created_at", { ascending: true });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Dispatch — SCHEDULED</h1>
      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Created</th>
              <th className="text-left p-3">Vehicle</th>
              <th className="text-left p-3">Customer</th>
              <th className="text-left p-3">Service</th>
              <th className="text-left p-3">PO</th>
              <th className="text-left p-3">Notes</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3"></th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((r: any) => {
              const v = r.vehicle || {};
              const label = [v.year, v.make, v.model, v.plate || v.unit_number].filter(Boolean).join(" ");
              const notesShort = (r.notes ?? "").length > 40 ? r.notes.slice(0, 40) + "…" : (r.notes ?? "—");
              return (
                <tr key={r.id} className="border-t align-top">
                  <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3">{label || "—"}</td>
                  <td className="p-3">{r.customer?.name ?? "—"}</td>
                  <td className="p-3">{r.service || "—"}</td>
                  <td className="p-3">{r.po || "—"}</td>
                  <td className="p-3 max-w-[240px]">{notesShort}</td>
                  <td className="p-3"><span className="inline-block rounded-full text-xs px-2 py-1 bg-amber-50 border border-amber-200">{r.status}</span></td>
                  <td className="p-3">
                    <form action={startAction}><input type="hidden" name="id" value={r.id} />
                      <button className="px-3 py-1 rounded bg-black text-white hover:opacity-80">Mark In Progress</button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {(rows ?? []).length === 0 && <tr><td colSpan={8} className="p-6 text-center text-gray-500">No SCHEDULED.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
