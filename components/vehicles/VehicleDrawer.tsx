"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";

import { TeslaServiceCard } from "@/components/tesla/TeslaServiceCard";
import { TeslaKV } from "@/components/tesla/TeslaKV";
import { TeslaStatusChip } from "@/components/tesla/TeslaStatusChip";

type Props = {
  vehicleId: string;
  open: boolean;
  onClose: () => void;
};

export default function VehicleDrawer({ vehicleId, open, onClose }: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<any>(null);

  /* ============================================================
     LOAD VEHICLE + SERVICE HISTORY
  ============================================================ */
  useEffect(() => {
    if (!vehicleId || !open) return;

    document.body.style.overflow = "hidden";

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/vehicles/${vehicleId}/history`,
          { credentials: "include" }
        );
        const js = await res.json();
        if (js.ok) setVehicle(js.vehicle);
      } catch (err) {
        console.error("Vehicle drawer load error:", err);
      }
      setLoading(false);
    })();

    return () => {
      document.body.style.overflow = "";
    };
  }, [vehicleId, open]);

  /* ============================================================
     COMPUTED RULES
  ============================================================ */
  const requests = vehicle?.service_requests || [];

  const hasActiveRequest = requests.some(
    (r: any) =>
      !["COMPLETED", "DECLINED"].includes(String(r.status).toUpperCase())
  );

  const canDeleteVehicle = requests.length === 0;

  /* ============================================================
     ARCHIVE VEHICLE
  ============================================================ */
  async function archiveVehicle() {
    if (!canDeleteVehicle) {
      alert("Vehicle cannot be removed while services exist.");
      return;
    }

    if (!confirm("Archive this vehicle? It will be removed from active use.")) {
      return;
    }

    const res = await fetch(`/api/customer/vehicles/${vehicleId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) {
      alert("Failed to archive vehicle");
      return;
    }

    onClose();
    router.refresh();
  }

  /* ============================================================
     RENDER
  ============================================================ */
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* BACKDROP */}
      <div
        className="flex-1 bg-black/40"
        onClick={onClose}
      />

      {/* PANEL */}
      <div className="w-[480px] bg-white h-full shadow-xl overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white">
          <button
            onClick={onClose}
            className="text-sm text-gray-600 mb-3"
          >
            ← Back
          </button>

          {loading || !vehicle ? (
            <div className="text-gray-500">Loading…</div>
          ) : (
            <>
              <h2 className="text-xl font-semibold">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h2>
              <p className="text-sm text-gray-600">
                Plate {vehicle.plate} • Unit {vehicle.unit_number}
              </p>

              <div className="flex gap-2 mt-4">
                <button
                  className="flex-1 py-2 rounded-lg bg-red-600 text-white font-semibold"
                  onClick={() =>
                    router.push(
                      `/customer/requests/new?vehicle_id=${vehicleId}`
                    )
                  }
                >
                  New Request
                </button>

                <button
                  disabled={hasActiveRequest}
                  className={clsx(
                    "flex-1 py-2 rounded-lg",
                    hasActiveRequest
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gray-100 hover:bg-gray-200"
                  )}
                >
                  Mileage
                </button>

                <button
                  className="flex-1 py-2 rounded-lg bg-black text-white"
                  disabled
                >
                  AI Brain
                </button>
              </div>
            </>
          )}
        </div>

        <div className="p-6 space-y-6">
          {!loading && vehicle && (
            <>
              <TeslaServiceCard title="Service History">
                {requests.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    No service history yet.
                  </div>
                ) : (
                  requests.map((r: any) => (
                    <div
                      key={r.id}
                      onClick={() =>
                        router.push(`/customer/requests/${r.id}`)
                      }
                      className="p-4 border rounded-xl bg-gray-50 mb-3 cursor-pointer hover:bg-gray-100 transition"
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-semibold capitalize">
                          {r.service_type?.replace("_", " ") || "Service"}
                        </div>
                        <TeslaStatusChip status={r.status} />
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <TeslaKV
                          k="Mileage"
                          v={r.mileage ?? "—"}
                        />
                        <TeslaKV
                          k="Date"
                          v={
                            r.created_at
                              ? new Date(r.created_at).toLocaleDateString()
                              : "—"
                          }
                        />
                      </div>
                    </div>
                  ))
                )}
              </TeslaServiceCard>

              <TeslaServiceCard title="Vehicle Actions">
                <button
                  disabled={!canDeleteVehicle}
                  onClick={archiveVehicle}
                  className={clsx(
                    "w-full py-2 rounded-lg font-semibold",
                    canDeleteVehicle
                      ? "bg-gray-900 text-white"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  )}
                >
                  {canDeleteVehicle
                    ? "Archive Vehicle"
                    : "Vehicle has service history"}
                </button>
              </TeslaServiceCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
