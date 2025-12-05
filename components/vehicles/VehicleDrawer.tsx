"use client";

import { useEffect, useState } from "react";
import { TeslaServiceCard } from "@/components/tesla/TeslaServiceCard";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaKV } from "@/components/tesla/TeslaKV";
import { TeslaStatusChip } from "@/components/tesla/TeslaStatusChip";
import clsx from "clsx";

type VehicleHistory = {
  id: string;
  make: string | null;
  model: string | null;
  year: number | null;
  unit_number: string | null;
  plate: string | null;
  vin: string | null;
  notes_internal: string | null;

  requests: {
    id: string;
    status: string;
    service: string | null;
    fmc: string | null;
    mileage: number | null;
    notes: string | null;
    dispatch_notes: string | null;
    po: string | null;
    ai_po_number: string | null;
    ai_status: string | null;
    created_at: string | null;
    started_at: string | null;
    completed_at: string | null;
    scheduled_start_at: string | null;
    scheduled_end_at: string | null;

    technician: {
      id: string;
      full_name: string | null;
    } | null;

    location: {
      id: string;
      name: string | null;
    } | null;

    images: {
      id: string;
      kind: string | null;
      url_full: string | null;
      url_thumb: string | null;
      created_at: string | null;
    }[];

    parts: {
      id: string;
      name: string | null;
      qty: number | null;
    }[];
  }[];
};

type Props = {
  vehicleId: string;
  open: boolean;
  onClose: () => void;
};

export default function VehicleDrawer({ vehicleId, open, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<VehicleHistory | null>(null);

  // Load vehicle history
  useEffect(() => {
    if (!vehicleId || !open) return;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/vehicles/${vehicleId}/history`, {
          credentials: "include",
        });
        const js = await res.json();
        if (js.ok) setVehicle(js.vehicle);
      } catch (err) {
        console.error("Vehicle history load error:", err);
      }
      setLoading(false);
    })();
  }, [vehicleId, open]);

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 flex transition",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
    >
      {/* BACKDROP */}
      <div
        className={clsx(
          "flex-1 bg-black/40 transition-opacity",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* DRAWER */}
      <div
        className={clsx(
          "w-[440px] max-w-full bg-white shadow-xl h-full overflow-y-auto transform transition-all duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* HEADER */}
        <div className="p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
          <button
            onClick={onClose}
            className="text-sm text-gray-600 mb-3 hover:text-black"
          >
            ← Back
          </button>

          {loading || !vehicle ? (
            <div className="text-gray-500">Loading vehicle…</div>
          ) : (
            <>
              <h2 className="text-[22px] font-semibold tracking-tight">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h2>
              <p className="text-gray-600 text-sm">
                Unit #{vehicle.unit_number} • Plate {vehicle.plate}
              </p>
              <p className="text-gray-500 text-xs">VIN: {vehicle.vin}</p>
            </>
          )}
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-6">
          {loading && <div className="text-gray-500">Loading…</div>}
          {!loading && vehicle && (
            <>
              {/* INTERNAL NOTES */}
              <TeslaServiceCard title="Internal Notes">
                <TeslaSection>
                  <TeslaKV
                    k="Notes"
                    v={vehicle.notes_internal || "—"}
                  />
                </TeslaSection>
              </TeslaServiceCard>

              {/* SERVICE HISTORY */}
              <TeslaServiceCard title="Service History">
                {vehicle.requests.length === 0 && (
                  <div className="text-gray-500 text-sm">
                    No service records found.
                  </div>
                )}

                {vehicle.requests.map((req) => (
                  <div
                    key={req.id}
                    className="border rounded-xl p-4 mb-4 bg-[#FAFAFA]"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold">
                        {req.service || "Service"}
                      </div>
                      <TeslaStatusChip status={req.status} />
                    </div>

                    {/* Key Values */}
                    <div className="space-y-1 text-sm text-gray-700">
                      <TeslaKV k="Created" v={req.created_at ? new Date(req.created_at).toLocaleString() : "—"} />
                      <TeslaKV k="Mileage" v={req.mileage || "—"} />
                      <TeslaKV k="PO" v={req.po || "—"} />
                      <TeslaKV k="AI Status" v={req.ai_status || "—"} />
                      <TeslaKV k="AI PO #" v={req.ai_po_number || "—"} />
                      <TeslaKV k="Technician" v={req.technician?.full_name || "—"} />
                      <TeslaKV k="Location" v={req.location?.name || "—"} />
                    </div>

                    {/* PARTS */}
                    {req.parts.length > 0 && (
                      <div className="mt-3">
                        <div className="font-medium text-sm mb-1">Parts Used</div>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {req.parts.map((p) => (
                            <li key={p.id}>
                              {p.name} — Qty {p.qty}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* IMAGES */}
                    {req.images.length > 0 && (
                      <div className="mt-3">
                        <div className="font-medium text-sm mb-1">Photos</div>

                        <div className="grid grid-cols-3 gap-2">
                          {req.images.map((img) => (
                            <div key={img.id} className="relative">
                              <img
                                src={img.url_thumb || img.url_full || ""}
                                className="w-full h-20 object-cover rounded-lg border cursor-pointer"
                                onClick={() =>
                                  window.open(img.url_full || img.url_thumb, "_blank")
                                }
                              />
                              {img.kind && (
                                <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                                  {img.kind.toUpperCase()}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </TeslaServiceCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}



