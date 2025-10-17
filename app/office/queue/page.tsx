// app/office/queue/page.tsx
import { supabaseServer } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";
import SaveButton from "./SaveButton";

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

/** STATUS HELPERS (unchanged except completeViaSteps) */
async function completeViaSteps(id: string, company_id: string) {
  const supabase = await supabaseServer();
  const now = new Date().toISOString();
  let { error } = await supabase
    .from("service_requests")
    .update({ status: "SCHEDULED", scheduled_at: now })
    .eq("id", id)
    .eq("company_id", company_id);
  if (error) throw new Error(error.message);

  ({ error } = await supabase
    .from("service_requests")
    .update({ status: "IN_PROGRESS", started_at: now })
    .eq("id", id)
    .eq("company_id", company_id));
  if (error) throw new Error(error.message);

  ({ error } = await supabase
    .from("service_requests")
    .update({ status: "COMPLETED", completed_at: now })
    .eq("id", id)
    .eq("company_id", company_id));
  if (error) throw new Error(error.message);
}

async function updateStatus(id: string, status: string) {
  "use server";
  const supabase = await supabaseServer();
  const company_id = await resolveCompanyId();
  if (!company_id) throw new Error("Missing company.");

  if (status === "COMPLETED") {
    await completeViaSteps(id, company_id);
    revalidatePath("/office/queue");
    return;
  }

  const now = new Date().toISOString();
  const patch: any =
    status === "SCHEDULED"
      ? { status, scheduled_at: now }
      : status === "IN_PROGRESS"
      ? { status, started_at: now }
      : { status };

  const { error } = await supabase
    .from("service_requests")
    .update(patch)
    .eq("id", id)
    .eq("company_id", company_id);

  if (error) throw new Error(error.message);
  revalidatePath("/office/queue");
}

// NOTE: we no longer use scheduleAction here; "Schedule now" links to /dispatch/assign
export async function waitApprovalAction(fd: FormData) {
  "use server";
  return updateStatus(String(fd.get("id") || ""), "WAITING_APPROVAL");
}
export async function declinedAction(fd: FormData) {
  "use server";
  return updateStatus(String(fd.get("id") || ""), "DECLINED");
}
export async function waitingPartsAction(fd: FormData) {
  "use server";
  return updateStatus(String(fd.get("id") || ""), "WAITING_PARTS");
}
export async function completeAction(fd: FormData) {
  "use server";
  return updateStatus(String(fd.get("id") || ""), "COMPLETED");
}

/** Robust server action for PO & Notes (trim/null, return value) */
export async function updateFieldsAction(fd: FormData) {
  "use server";
  const id = String(fd.get("id") || "");
  const po = (fd.get("po") || "") as string;
  const notes = (fd.get("notes") || "") as string;

  if (!id) throw new Error("Missing request id.");

  const supabase = await supabaseServer();
  const company_id = await resolveCompanyId();
  if (!company_id) throw new Error("Missing company.");

  const poClean = po.trim();
  const notesClean = notes.trim();
  const patch: Record<string, any> = {
    po: poClean ? poClean : null,
    notes: notesClean ? notesClean : null,
  };

  const { error } = await supabase
    .from("service_requests")
    .update(patch)
    .eq("id", id)
    .eq("company_id", company_id);

  if (error) throw new Error(error.message);

  revalidatePath("/office/queue");
  return { ok: true, id, patch };
}

export default async function OfficeQueuePage() {
  const supabase = await supabaseServer();
  const company_id = await resolveCompanyId();
  if (!company_id) return <div className="p-6">No company detected.</div>;

  const { data: rows, error } = await supabase
    .from("service_requests")
    .select(`
      id, created_at, status, service, fmc, mileage, po, notes,
      vehicle:vehicle_id ( year, make, model, plate, unit_number ),
      customer:customer_id ( name )
    `)
    .eq("company_id", company_id)
    .in("status", ["NEW", "WAITING_APPROVAL", "DECLINED", "WAITING_PARTS"])
    .order("created_at", { ascending: false });

  if (error) return <div className="p-6">Failed to load queue.</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Office Queue</h1>

      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm align-top">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Created</th>
              <th className="text-left p-3">Vehicle</th>
              <th className="text-left p-3">Customer</th>
              <th className="text-left p-3">Service</th>
              <th className="text-left p-3">PO / Notes</th>
              <th className="text-left p-3">FMC</th>
              <th className="text-left p-3">Miles</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Actions</th>
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

                  {/* Inline PO/Notes editor */}
                  <td className="p-3 w-[360px]">
                    <form action={updateFieldsAction} className="space-y-2">
                      <input type="hidden" name="id" value={r.id} />
                      <input
                        name="po"
                        defaultValue={r.po ?? ""}
                        placeholder="PO…"
                        className="w-full border rounded px-2 py-1"
                      />
                      <textarea
                        name="notes"
                        defaultValue={r.notes ?? ""}
                        rows={2}
                        placeholder="Notes…"
                        className="w-full border rounded px-2 py-1"
                      />
                      <SaveButton />
                    </form>
                  </td>

                  <td className="p-3">{r.fmc || "—"}</td>
                  <td className="p-3">{r.mileage ?? "—"}</td>
                  <td className="p-3">
                    <span className="inline-block rounded-full text-xs px-2 py-1 bg-blue-50 border border-blue-200">
                      {r.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="p-3 space-y-2">
                    {/* Handoff to Dispatch */}
                    <a
                      href={`/dispatch/assign?id=${encodeURIComponent(r.id)}`}
                      className="px-3 py-1 rounded bg-black text-white hover:opacity-80 w-full block text-center"
                    >
                      Schedule now
                    </a>

                    <div className="flex gap-2">
                      <form action={waitApprovalAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <button className="px-2 py-1 rounded border w-full">Waiting Approval</button>
                      </form>
                      <form action={waitingPartsAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <button className="px-2 py-1 rounded border w-full">Waiting Parts</button>
                      </form>
                    </div>

                    <div className="flex gap-2">
                      <form action={declinedAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <button className="px-2 py-1 rounded border w-full">Declined</button>
                      </form>
                      <form action={completeAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <button className="px-2 py-1 rounded border w-full">Completed</button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {(rows ?? []).length === 0 && (
              <tr>
                <td colSpan={9} className="p-6 text-center text-gray-500">
                  No items.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
