"use client";

import { useEffect, useState } from "react";
import {
  HealthRing,
  PredictionCard,
  RiskChip,
  Timeline,
} from "@/components/ai-fleet";

export default function VehicleBrainDrawer({
  open,
  onClose,
  vehicleId,
}: {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // ------------------------------------------
  // LOAD AI VEHICLE HEALTH DATA
  // ------------------------------------------
  useEffect(() => {
    if (!open) return;

    (async () => {
      setLoading(true);

      try {
        const res = await fetch(`/api/health/vehicle/${vehicleId}`, {
          cache: "no-store",
          credentials: "include",
        });

        const js = await res.json();
        setData(js);
      } catch (err) {
        console.error("Error loading AI vehicle data:", err);
      }

      setLoading(false);
    })();
  }, [open, vehicleId]);

  return (
    <>
      {/* BACKDROP */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={onClose}
        />
      )}

      {/* DRAWER PANEL */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full sm:w-[420px]
          bg-white shadow-xl z-50 p-6 overflow-y-auto
          transform transition-transform
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <button className="text-sm underline mb-4" onClick={onClose}>
          Close
        </button>

        {loading && <p>Loading…</p>}

        {!loading && data && (
          <>
            {/* HEADER */}
            <h2 className="text-2xl font-semibold mb-6">
              AI Vehicle Brain
            </h2>

            {/* HEALTH SCORE */}
            <div className="flex justify-center">
              <HealthRing score={data.health} />
            </div>

            {/* RISKS */}
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-2">Risks</h3>
              <div className="space-y-3">
                {data.risks?.map((r: any, i: number) => (
                  <RiskChip key={i} risk={r} />
                ))}
              </div>
            </div>

            {/* PREDICTIONS */}
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-2">Predicted Failures</h3>
              <div className="space-y-4">
                {data.predictions?.map((p: any, i: number) => (
                  <PredictionCard key={i} item={p} />
                ))}
              </div>
            </div>

            {/* MAINTENANCE TIMELINE */}
            <div className="mt-8 mb-10">
              <h3 className="text-lg font-medium mb-2">Maintenance Timeline</h3>
              <Timeline items={data.upcoming || []} />
            </div>

            {/* QUICK ACTIONS */}
            <div className="mt-10 space-y-3">

              {/* Schedule Service */}
              <button
                onClick={() =>
                  (window.location.href =
                    `/customer/requests/new?vehicle_id=${vehicleId}`)
                }
                className="w-full py-3 rounded-xl bg-black text-white font-semibold hover:bg-gray-900"
              >
                Schedule Service Now
              </button>

              {/* Send Alert to Dispatch */}
              <button
                onClick={async () => {
                  const res = await fetch("/api/dispatch/alert", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ vehicle_id: vehicleId }),
                  });

                  const js = await res.json();

                  if (!res.ok) {
                    alert(js.error || "Error sending alert");
                    return;
                  }

                  alert("Dispatch notified successfully!");
                }}
                className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700"
              >
                Send Alert to Dispatch
              </button>

            </div>
          </>
        )}
      </div>
    </>
  );
}
