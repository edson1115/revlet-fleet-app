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

  mileage_override: number | null;
  last_reported_mileage: number | null;
  last_mileage_at: string | null;

  notes_internal: string | null;
  service_requests: any[];
};

type Props = {
  vehicleId: string;
  open: boolean;
  onClose: () => void;
};

export default function VehicleDrawer({ vehicleId, open, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<VehicleHistory | null>(null);

  const [mileageOpen, setMileageOpen] = useState(false);
  const [mileageValue, setMileageValue] = useState("");

  const [aiOpen, setAiOpen] = useState(false);

  // ------------------------------------------
  // LOAD VEHICLE HISTORY
  // ------------------------------------------
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

  // ------------------------------------------
  // SAVE MILEAGE
  // ------------------------------------------
  async function saveMileage() {
    if (!mileageValue.trim()) return alert("Mileage required.");

    const val = parseInt(mileageValue);
    if (isNaN(val)) return alert("Mileage must be a number.");

    try {
      const res = await fetch(`/api/customer/vehicles/${vehicleId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mileage: val }),
      });

      const js = await res.json();
      if (!res.ok) return alert("Save failed:\n" + js.error);

      setMileageOpen(false);
      setMileageValue("");

      // Reload history
      const reload = await fetch(`/api/vehicles/${vehicleId}/history`, {
        credentials: "include",
      });
      const reloadJs = await reload.json();
      if (reloadJs.ok) setVehicle(reloadJs.vehicle);
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  }

  // ------------------------------------------
  // COMPUTE DISPLAYED MILEAGE
  // ------------------------------------------
  let displayedMileage: any = "—";

  if (vehicle) {
    // 1) Latest service request mileage
    if (vehicle.service_requests?.length > 0) {
      const latest = vehicle.service_requests
        .filter((r: any) => r.mileage !== null)
        .sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        )[0];

      if (latest?.mileage) {
        displayedMileage = latest.mileage;
      }
    }

    // 2) Override
    if (displayedMileage === "—" && vehicle.mileage_override) {
      displayedMileage = vehicle.mileage_override;
    }

    // 3) Last reported
    if (displayedMileage === "—" && vehicle.last_reported_mileage) {
      displayedMileage = vehicle.last_reported_mileage;
    }

    if (displayedMileage == null) displayedMileage = "—";
  }

  // ------------------------------------------
  // RETURN DRAWER UI
  // ------------------------------------------
  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 flex transition",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
    >
      {/* BACKDROP */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* DRAWER */}
      <div
        className={clsx(
          "w-[440px] max-w-full bg-white shadow-xl h-full overflow-y-auto transform transition-all duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* HEADER */}
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
          <button
            onClick={onClose}
            className="text-sm text-gray-600 mb-3 hover:text-black"
          >
            ← Back
          </button>

          {!vehicle || loading ? (
            <div className="text-gray-500">Loading…</div>
          ) : (
            <>
              <h2 className="text-[22px] font-semibold">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h2>

              <p className="text-gray-600 text-sm">
                Unit #{vehicle.unit_number} • Plate {vehicle.plate}
              </p>

              <p className="text-gray-500 text-xs mb-3">VIN: {vehicle.vin}</p>

              {/* Mileage */}
              <p className="text-gray-700 text-sm">
                Mileage: {displayedMileage} mi
              </p>

              <button
                onClick={() => {
                  setMileageValue(
                    String(
                      vehicle.mileage_override ??
                        vehicle.last_reported_mileage ??
                        ""
                    )
                  );
                  setMileageOpen(true);
                }}
                className="mt-2 w-full py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                Update Mileage
              </button>

              {/* ACTION BUTTONS */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setAiOpen(true)}
                  className="flex-1 py-2 rounded-lg bg-black text-white font-semibold hover:bg-gray-900"
                >
                  AI Brain
                </button>

                <button
                  onClick={() =>
                    (window.location.href = `/customer/requests/new?vehicle_id=${vehicleId}`)
                  }
                  className="flex-1 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
                >
                  New Request
                </button>
              </div>
            </>
          )}
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-6">
          {!loading && vehicle && (
            <>
              <TeslaServiceCard title="Internal Notes">
                <TeslaSection>
                  <TeslaKV k="Notes" v={vehicle.notes_internal || "—"} />
                </TeslaSection>
              </TeslaServiceCard>

              <TeslaServiceCard title="Service History">
                {(!vehicle.service_requests ||
                  vehicle.service_requests.length === 0) && (
                  <p className="text-gray-500 text-sm">
                    No service records found.
                  </p>
                )}

                {(vehicle.service_requests || []).map((req: any) => (
                  <div
                    key={req.id}
                    className="p-4 bg-[#FAFAFA] border rounded-xl mb-4"
                  >
                    <div className="flex justify-between mb-2">
                      <div className="font-semibold">
                        {req.service || "Service"}
                      </div>
                      <TeslaStatusChip status={req.status} />
                    </div>

                    <TeslaKV
                      k="Created"
                      v={
                        req.created_at
                          ? new Date(req.created_at).toLocaleString()
                          : "—"
                      }
                    />
                    <TeslaKV k="Mileage" v={req.mileage || "—"} />
                    <TeslaKV k="PO" v={req.po || "—"} />
                    <TeslaKV k="AI Status" v={req.ai_status || "—"} />
                    <TeslaKV k="AI PO #" v={req.ai_po_number || "—"} />
                    <TeslaKV
                      k="Technician"
                      v={req.technician?.full_name || "—"}
                    />
                    <TeslaKV k="Location" v={req.location?.name || "—"} />
                  </div>
                ))}
              </TeslaServiceCard>
            </>
          )}
        </div>
      </div>

      {/* AI PANEL */}
      {aiOpen && (
        <div className="fixed inset-0 z-[999] flex">
          <div className="flex-1 bg-black/40" onClick={() => setAiOpen(false)} />
          <div className="w-[480px] bg-white h-full shadow-xl p-6 overflow-y-auto">
            <h2 className="text-2xl font-semibold mb-2">AI Brain</h2>
            <p className="text-gray-600 text-sm">
              Intelligent diagnostics, PO prediction, and service suggestions coming soon.
            </p>
          </div>
        </div>
      )}

      {/* MILEAGE MODAL */}
      {mileageOpen && (
        <div className="fixed inset-0 z-[999] flex">
          <div
            className="flex-1 bg-black/40"
            onClick={() => setMileageOpen(false)}
          />
          <div className="w-[400px] bg-white h-full shadow-xl p-6">
            <h2 className="text-xl font-semibold mb-3">Update Mileage</h2>

            <input
              type="number"
              value={mileageValue}
              onChange={(e) => setMileageValue(e.target.value)}
              className="w-full border rounded-lg p-3 bg-gray-50"
            />

            <button
              onClick={saveMileage}
              className="w-full mt-4 py-3 rounded-xl bg-black text-white font-semibold hover:bg-gray-900"
            >
              Save Mileage
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
