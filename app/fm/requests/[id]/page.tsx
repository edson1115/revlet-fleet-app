// app/fm/requests/[id]/page.tsx
import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { id: string };

function vehLabel(v: any) {
  if (!v) return "—";
  const parts: string[] = [];
  if (v.unit_number) parts.push(`#${v.unit_number}`);
  if (v.year) parts.push(String(v.year));
  if (v.make) parts.push(v.make);
  if (v.model) parts.push(v.model);
  if (v.plate) parts.push(`(${v.plate})`);
  const label = parts.filter(Boolean).join(" ");
  return label || "—";
}

function fmtDateTime(dt?: string | null) {
  if (!dt) return "—";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return dt || "—";
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  // 🔧 In your setup, params is a Promise – so we await it
  const { id } = await params;

  const supabase = await supabaseServer();

  const { data: row, error } = await supabase
    .from("service_requests")
    .select(
      `
      id,
      status,
      created_at,
      scheduled_at,
      started_at,
      completed_at,
      service,
      po,
      notes,
      dispatch_notes,
      mileage,
      fmc,
      fmc_text,
      source,
      customer:customer_id (
        id,
        name,
        market
      ),
      vehicle:vehicle_id (
        id,
        year,
        make,
        model,
        plate,
        unit_number
      ),
      location:location_id (
        id,
        name
      ),
      technician:technician_id (
        id,
        full_name
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Request</h1>
          <Link
            className="text-sm text-blue-600 underline"
            href="/fm/requests"
          >
            Back to Requests
          </Link>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error.message}
        </div>
      </div>
    );
  }

  if (!row) {
    return (
      <div className="mx-auto max-w-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Request</h1>
          <Link
            className="text-sm text-blue-600 underline"
            href="/fm/requests"
          >
            Back to Requests
          </Link>
        </div>
        <div className="text-sm text-gray-600">Not found.</div>
      </div>
    );
  }

  const friendlyId = row.id ? String(row.id).slice(0, 8) : "";
  const techName = row.technician?.full_name || row.technician?.id || null;

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Request{" "}
            <span className="font-mono text-base text-gray-500">
              {friendlyId}
            </span>
          </h1>
          <p className="text-sm text-gray-600">
            Full history and context for this service request.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs">
            {row.status}
          </span>
          <Link
            className="text-xs text-blue-600 underline"
            href="/fm/requests"
          >
            ← Back to Requests
          </Link>
        </div>
      </div>

      {/* Top summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Status / timeline */}
        <div className="rounded-2xl border p-4 space-y-2">
          <div className="text-xs font-semibold uppercase text-gray-500">
            Status &amp; timeline
          </div>
          <div className="mt-1 space-y-1 text-sm">
            <div>
              <span className="text-gray-500">Created:</span>{" "}
              {fmtDateTime(row.created_at)}
            </div>
            <div>
              <span className="text-gray-500">Scheduled:</span>{" "}
              {fmtDateTime(row.scheduled_at)}
            </div>
            <div>
              <span className="text-gray-500">Started:</span>{" "}
              {fmtDateTime(row.started_at)}
            </div>
            <div>
              <span className="text-gray-500">Completed:</span>{" "}
              {fmtDateTime(row.completed_at)}
            </div>
          </div>
        </div>

        {/* Vehicle */}
        <div className="rounded-2xl border p-4 space-y-2">
          <div className="text-xs font-semibold uppercase text-gray-500">
            Vehicle
          </div>
          <div className="text-sm font-medium">{vehLabel(row.vehicle)}</div>
          {row.vehicle?.id && (
            <div className="text-[11px] text-gray-500">
              Vehicle ID: {row.vehicle.id}
            </div>
          )}

          <div className="mt-3 text-xs font-semibold uppercase text-gray-500">
            Technician
          </div>
          <div className="text-sm">{techName || "—"}</div>
        </div>

        {/* Customer / Location */}
        <div className="rounded-2xl border p-4 space-y-2">
          <div className="text-xs font-semibold uppercase text-gray-500">
            Customer
          </div>
          <div className="text-sm font-medium">
            {row.customer?.name ?? "—"}
          </div>
          <div className="text-xs text-gray-500">
            Market: {row.customer?.market ?? "—"}
          </div>

          <div className="mt-3 text-xs font-semibold uppercase text-gray-500">
            Location
          </div>
          <div className="text-sm">{row.location?.name ?? "—"}</div>

          <div className="mt-3 text-xs text-gray-500">
            Source:{" "}
            <span className="inline-flex items-center rounded-full border px-2 py-0.5">
              {row.source || "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Service details */}
      <div className="rounded-2xl border p-4 space-y-4">
        <div>
          <div className="text-xs font-semibold uppercase text-gray-500">
            Service
          </div>
          <div className="mt-1 text-sm">{row.service ?? "—"}</div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-xs font-semibold uppercase text-gray-500">
              PO
            </div>
            <div className="mt-1 text-sm">{row.po ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase text-gray-500">
              FMC
            </div>
            <div className="mt-1 text-sm">
              {row.fmc_text || row.fmc || "—"}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase text-gray-500">
              Mileage
            </div>
            <div className="mt-1 text-sm">
              {row.mileage != null ? `${row.mileage} mi` : "—"}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase text-gray-500">
              Office Notes
            </div>
            <div className="mt-1 whitespace-pre-wrap text-sm">
              {row.notes ?? "—"}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase text-gray-500">
              Dispatcher Notes
            </div>
            <div className="mt-1 whitespace-pre-wrap text-sm">
              {row.dispatch_notes ?? "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
