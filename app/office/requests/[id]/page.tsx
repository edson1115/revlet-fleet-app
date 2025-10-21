// app/office/requests/[id]/page.tsx
import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { id: string };

function vehLabel(v: any) {
  if (!v) return "—";
  return [v.year, v.make, v.model, v.plate || v.unit_number].filter(Boolean).join(" ") || "—";
}

export default async function OfficeRequestDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;

  const supabase = await supabaseServer();

  const { data: row, error } = await supabase
    .from("service_requests")
    .select(
      `
      id, status, created_at, scheduled_at, started_at, completed_at,
      service, po, notes,
      customer:customer_id ( name, market ),
      vehicle:vehicle_id ( year, make, model, plate, unit_number )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-xl font-semibold">Request</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
          {error.message}
        </div>
        <Link className="text-blue-600 underline text-sm" href="/office/queue">
          ← Back to Office Queue
        </Link>
      </div>
    );
  }

  if (!row) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-xl font-semibold">Request</h1>
        <div className="text-sm text-gray-600">Not found.</div>
        <Link className="text-blue-600 underline text-sm" href="/office/queue">
          ← Back to Office Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Request {row.id.slice(0, 8)}</h1>
        <Link className="text-blue-600 underline text-sm" href="/office/queue">
          ← Back to Office
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-4 space-y-2">
          <div className="text-sm text-gray-500">Status</div>
          <div className="text-lg">{row.status}</div>
          <div className="text-xs text-gray-500">
            Created: {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
          </div>
          <div className="text-xs text-gray-500">
            Scheduled: {row.scheduled_at ? new Date(row.scheduled_at).toLocaleString() : "—"}
          </div>
          <div className="text-xs text-gray-500">
            Started: {row.started_at ? new Date(row.started_at).toLocaleString() : "—"}
          </div>
          <div className="text-xs text-gray-500">
            Completed: {row.completed_at ? new Date(row.completed_at).toLocaleString() : "—"}
          </div>
        </div>

        <div className="rounded-2xl border p-4 space-y-2">
          <div className="text-sm text-gray-500">Vehicle</div>
          <div className="text-lg">{vehLabel(row.vehicle)}</div>

          <div className="text-sm text-gray-500 mt-3">Customer</div>
          <div className="text-lg">{row.customer?.name ?? "—"}</div>
          <div className="text-xs text-gray-500">
            Market: {row.customer?.market ?? "—"}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border p-4 space-y-3">
        <div>
          <div className="text-sm text-gray-500">Service</div>
          <div>{row.service ?? "—"}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">PO</div>
          <div>{row.po ?? "—"}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Notes</div>
          <div className="whitespace-pre-wrap">{row.notes ?? "—"}</div>
        </div>
      </div>
    </div>
  );
}
