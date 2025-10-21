// app/tech/queue/page.tsx
import { supabaseServer } from "@/lib/supabaseServer";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Row = {
  id: string;
  status: string;
  created_at: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  service: string | null;
  po: string | null;
  notes: string | null;
  vehicle?: {
    year?: number | null;
    make?: string | null;
    model?: string | null;
    plate?: string | null;
    unit_number?: string | null;
  } | null;
  customer?: {
    name?: string | null;
  } | null;
};

function vehLabel(v: Row["vehicle"]) {
  if (!v) return "—";
  return [v.year, v.make, v.model, v.plate || v.unit_number].filter(Boolean).join(" ") || "—";
}

export default async function TechQueuePage() {
  const supabase = await supabaseServer();

  // Who am I?
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id || null;

  // Attempt to detect company_id from profile or vehicles fallback
  let company_id: string | null = null;
  if (uid) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", uid)
      .maybeSingle();
    company_id = (prof?.company_id as string) ?? null;
  }
  if (!company_id) {
    const { data: v } = await supabase
      .from("vehicles")
      .select("company_id")
      .not("company_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    company_id = (v?.company_id as string) ?? null;
  }

  if (!company_id) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Tech Queue</h1>
        <p className="text-sm text-gray-600 mt-2">No company detected.</p>
      </div>
    );
  }

  // Pull IN_PROGRESS jobs; if you want SCHEDULED as well, change the filter below.
  const { data: rows } = await supabase
    .from("service_requests")
    .select(
      `
      id, status, created_at, scheduled_at, started_at, service, po, notes,
      vehicle:vehicle_id ( year, make, model, plate, unit_number ),
      customer:customer_id ( name )
    `
    )
    .eq("company_id", company_id)
    .eq("status", "IN_PROGRESS")
    .order("started_at", { ascending: true });

  // ---- Server Action (not exported) to mark completed
  async function completeAction(formData: FormData) {
    "use server";
    const id = String(formData.get("id") || "");
    if (!id) return;

    // Call your API that completes from any state (we’ll allow this from Tech)
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/requests/${id}/complete`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      // no body needed; the API walks to COMPLETED
      cache: "no-store",
    });

    // Revalidate this page (optional: using unstable_noStore or revalidatePath if set up)
    // For now we just redirect back to the queue to show updated list.
  }

  const list = (rows as Row[]) ?? [];

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tech Queue</h1>
        <Link href="/dispatch/scheduled" className="text-sm text-blue-600 underline">
          View Dispatch
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border p-6 text-sm text-gray-600">No jobs in progress.</div>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Started</th>
                <th className="text-left p-3">Customer</th>
                <th className="text-left p-3">Vehicle</th>
                <th className="text-left p-3">Service</th>
                <th className="text-left p-3">PO</th>
                <th className="text-left p-3">Notes</th>
                <th className="text-left p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="border-t align-top">
                  <td className="p-3">
                    {r.started_at ? new Date(r.started_at).toLocaleString() : "—"}
                  </td>
                  <td className="p-3">{r.customer?.name ?? "—"}</td>
                  <td className="p-3">{vehLabel(r.vehicle)}</td>
                  <td className="p-3">{r.service ?? "—"}</td>
                  <td className="p-3">{r.po ?? "—"}</td>
                  <td className="p-3 max-w-[320px]">
                    {(r.notes ?? "").length > 80 ? (r.notes ?? "").slice(0, 80) + "…" : r.notes ?? "—"}
                  </td>
                  <td className="p-3">
                    <form action={completeAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <button
                        className="rounded-lg border px-3 py-1 hover:bg-gray-50"
                        title="Mark as Completed"
                      >
                        Complete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
