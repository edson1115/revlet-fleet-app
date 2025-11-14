// app/portal/requests/[id]/page.tsx
import { supabaseServer } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = { id: string };

function fmt(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
}

function vehLabel(v: any) {
  if (!v) return "—";
  const arr = [v.year, v.make, v.model, v.plate || v.unit_number];
  return arr.filter(Boolean).join(" ") || "—";
}

export default async function CustomerRequestDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = params;

  const supabase = await supabaseServer();

  const { data: row, error } = await supabase
    .from("service_requests")
    .select(
      `
      id, status, service, notes, dispatch_notes, fmc, po, mileage,
      created_at, scheduled_at, started_at, completed_at,
      eta_start, eta_minutes, eta_live,

      customer:customer_id ( id, name ),
      vehicle:vehicle_id ( id, year, make, model, plate, unit_number ),
      technician:technician_id ( id, full_name, name )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-3">Request</h1>
        <div className="border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
          {error.message}
        </div>
        <Link
          href="/portal/requests"
          className="text-sm text-blue-600 underline mt-4 inline-block"
        >
          Back to Requests
        </Link>
      </div>
    );
  }

  if (!row) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-3">Request</h1>
        <div className="text-gray-600 text-sm">Not found.</div>
        <Link
          href="/portal/requests"
          className="text-sm text-blue-600 underline mt-4 inline-block"
        >
          Back to Requests
        </Link>
      </div>
    );
  }

  /* ============================================================
     ETA LOGIC (server-side, simple)
     ============================================================ */
  let etaBlock = null;

  if (row.eta_live && row.eta_start && row.eta_minutes) {
    const start = new Date(row.eta_start);
    const end = new Date(start.getTime() + row.eta_minutes * 60000);
    const now = new Date();

    let remaining = Math.round((end.getTime() - now.getTime()) / 60000);

    let label = "";
    if (remaining <= 0) {
      label = "Arriving now";
      remaining = 0;
    } else {
      label = `Technician arriving in ${remaining} minute${remaining === 1 ? "" : "s"}`;
    }

    etaBlock = (
      <div className="rounded-2xl border bg-green-50 p-5 space-y-1">
        <div className="text-sm text-gray-700 font-medium">Live Arrival ETA</div>
        <div className="text-lg font-semibold text-green-700">{label}</div>

        <div className="text-sm text-gray-600 pt-2">
          Window: {start.toLocaleTimeString()} → {end.toLocaleTimeString()}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Service Request</h1>
        <Link
          href="/portal/requests"
          className="text-sm text-blue-600 underline"
        >
          Back
        </Link>
      </div>

      {/* ETA CARD (only if active) */}
      {etaBlock}

      {/* STATUS CARD */}
      <div className="rounded-2xl border bg-white p-5 space-y-2">
        <div className="text-sm text-gray-500">Status</div>
        <div className="text-lg font-medium">{row.status}</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 pt-2">
          <div>Created: {fmt(row.created_at)}</div>
          <div>Scheduled: {fmt(row.scheduled_at)}</div>
          <div>Started: {fmt(row.started_at)}</div>
          <div>Completed: {fmt(row.completed_at)}</div>
        </div>
        {/* ETA CARD */}
{(row.eta_start || row.eta_end || row.scheduled_at) && (
  <div className="rounded-2xl border bg-white p-5 space-y-3">
    <div className="text-sm text-gray-500">Estimated Arrival</div>

    {/* Main ETA window */}
    <div className="text-lg font-medium">
      {row.eta_start
        ? new Date(row.eta_start).toLocaleString()
        : "—"}{" "}
      →{" "}
      {row.eta_end
        ? new Date(row.eta_end).toLocaleString()
        : "—"}
    </div>

    {/* Scheduled time fallback */}
    {(!row.eta_start || !row.eta_end) && row.scheduled_at && (
      <div className="text-sm text-gray-500">
        Scheduled for:{" "}
        {new Date(row.scheduled_at).toLocaleString()}
      </div>
    )}

    {/* Live status messaging */}
    <div className="text-sm">
      {row.completed_at ? (
        <span className="text-green-700">
          ✔ Work completed
        </span>
      ) : row.started_at ? (
        <span className="text-blue-700">
          Technician is working on your vehicle
        </span>
      ) : row.status === "SCHEDULED" ? (
        <span className="text-amber-700">
          Technician is on the way / will arrive within the scheduled window
        </span>
      ) : (
        <span className="text-gray-600">Awaiting technician assignment</span>
      )}
    </div>
  </div>
)}

      </div>

      {/* VEHICLE + CUSTOMER */}
      <div className="rounded-2xl border bg-white p-5 space-y-4">
        <div>
          <div className="text-sm text-gray-500">Vehicle</div>
          <div className="text-lg font-medium">{vehLabel(row.vehicle)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Customer</div>
          <div className="text-lg font-medium">{row.customer?.name || "—"}</div>
        </div>
        {row.technician && (
          <div>
            <div className="text-sm text-gray-500">Technician</div>
            <div className="text-lg font-medium">
              {row.technician.full_name ||
                row.technician.name ||
                row.technician.id}
            </div>
          </div>
        )}
      </div>

      {/* SERVICE DETAILS */}
      <div className="rounded-2xl border bg-white p-5 space-y-3">
        <div>
          <div className="text-sm text-gray-500">Service</div>
          <div>{row.service || "—"}</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">PO</div>
          <div>{row.po || "—"}</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Mileage</div>
          <div>{row.mileage ?? "—"}</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">FMC</div>
          <div>{row.fmc || "—"}</div>
        </div>
      </div>

      {/* NOTES */}
      {(row.notes || row.dispatch_notes) && (
        <div className="rounded-2xl border bg-white p-5 space-y-4">
          {row.notes && (
            <div>
              <div className="text-sm text-gray-500">Notes</div>
              <div className="whitespace-pre-wrap">{row.notes}</div>
            </div>
          )}

          {row.dispatch_notes && (
            <div>
              <div className="text-sm text-gray-500">Dispatcher Notes</div>
              <div className="whitespace-pre-wrap">{row.dispatch_notes}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
