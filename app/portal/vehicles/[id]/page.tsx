import { supabaseServer } from "@/lib/supabaseServer";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { id: string };

function vehLabel(v: any) {
  if (!v) return "—";
  return [v.year, v.make, v.model, v.plate || v.unit_number]
    .filter(Boolean)
    .join(" ");
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = params; // <-- FIXED: no need to await

  const supabase = await supabaseServer();

  /** 1) Load vehicle + ensure customer-scoped */
  const { data: vehicle, error: vehErr } = await supabase
    .from("vehicles")
    .select(
      `
        id, year, make, model, plate, unit_number, vin,
        location:location_id ( name ),
        customer_id
      `
    )
    .eq("id", id)
    .maybeSingle();

  if (vehErr) {
    return (
      <div className="p-6 mx-auto max-w-3xl">
        <h1 className="text-xl font-semibold mb-3">Vehicle</h1>
        <div className="rounded border bg-red-50 border-red-200 text-red-700 p-3 text-sm">
          {vehErr.message}
        </div>
        <Link href="/portal/vehicles" className="underline mt-4 inline-block">
          Back to Vehicles
        </Link>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="p-6 mx-auto max-w-3xl">
        <h1 className="text-xl font-semibold mb-3">Vehicle</h1>
        <div className="text-gray-600 text-sm">Not found.</div>
        <Link href="/portal/vehicles" className="underline mt-4 inline-block">
          Back to Vehicles
        </Link>
      </div>
    );
  }

  /** 2) Load recent requests for this vehicle */
  const { data: requests } = await supabase
    .from("service_requests")
    .select(
      `
        id, status, created_at, scheduled_at, service,
        dispatch_notes,
        fmc_text,
        images:service_request_images ( id, url_thumb, url_work, kind )
      `
    )
    .eq("vehicle_id", vehicle.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="p-6 mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {vehLabel(vehicle) || "Vehicle"}
        </h1>

        <Link
          href="/portal/vehicles"
          className="text-blue-600 underline text-sm"
        >
          Back to Vehicles
        </Link>
      </div>

      {/* Vehicle Card */}
      <div className="rounded-2xl border p-4 bg-white space-y-2">
        <div>
          <div className="text-xs text-gray-500">Vehicle</div>
          <div className="text-lg font-medium">{vehLabel(vehicle)}</div>
        </div>

        <div className="grid md:grid-cols-2 gap-3 pt-2">
          <div>
            <div className="text-xs text-gray-500">Plate</div>
            <div>{vehicle.plate || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Unit #</div>
            <div>{vehicle.unit_number || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">VIN</div>
            <div>{vehicle.vin || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Location</div>
            <div>{vehicle.location?.name || "—"}</div>
          </div>
        </div>

        {/* Create Request */}
        <div className="pt-4">
          <Link
            href={`/fm/requests/new?vehicle_id=${vehicle.id}`}
            className="inline-block text-sm rounded-lg bg-black text-white px-4 py-2 hover:bg-gray-800"
          >
            Create Service Request for this Vehicle
          </Link>
        </div>
      </div>

      {/* Recent Requests */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Requests</h2>

        {(!requests || requests.length === 0) && (
          <div className="text-gray-500 text-sm">No recent activity.</div>
        )}

        <div className="space-y-3">
          {requests?.map((r) => (
            <Link
              key={r.id}
              href={`/portal/requests/${r.id}`}
              className="block rounded-2xl border bg-white p-4 hover:shadow transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">{r.service || "Service"}</div>
                <div className="text-sm text-gray-500">
                  {fmtDate(r.created_at)}
                </div>
              </div>

              <div className="mt-1 text-xs inline-block px-2 py-1 border rounded-full">
                {r.status}
              </div>

              {/* Photo thumbnails */}
              {r.images && r.images.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-3">
                  {r.images.slice(0, 6).map((img: any) => (
                    <img
                      key={img.id}
                      src={img.url_thumb}
                      className="w-14 h-14 rounded-lg object-cover border"
                      alt="thumb"
                    />
                  ))}
                </div>
              )}

              {/* FMC note */}
              {r.fmc_text && (
                <div className="text-xs text-gray-600 mt-2">
                  <span className="font-medium">FMC:</span> {r.fmc_text}
                </div>
              )}

              {/* Dispatch Notes */}
              {r.dispatch_notes && (
                <div className="text-xs text-gray-600 mt-1">
                  <span className="font-medium">Dispatch Notes:</span>{" "}
                  {r.dispatch_notes}
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
