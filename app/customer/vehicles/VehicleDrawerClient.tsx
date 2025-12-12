"use client";

import { useState } from "react";
import clsx from "clsx";

import { TeslaDivider } from "@/components/tesla/TeslaDivider";
import { TeslaSection } from "@/components/tesla/TeslaSection";

import { useDamageAnalysis } from "@/app/hooks/useDamageAnalysis";
import { useAISummary } from "@/app/hooks/useAISummary";
import { useAIParts } from "@/app/hooks/useAIParts";
import { useAINextService } from "@/app/hooks/useAINextService";

export default function VehicleDrawerClient({ vehicle, onClose }: any) {
  if (!vehicle) return null;

  const [mileage, setMileage] = useState(vehicle.mileage || "");
  const [savingMileage, setSavingMileage] = useState(false);

  const dmg = useDamageAnalysis();
  const summary = useAISummary();
  const parts = useAIParts();
  const next = useAINextService();

  async function saveMileage() {
    setSavingMileage(true);
    await fetch(`/api/customer/vehicles/${vehicle.id}/update-mileage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mileage }),
    });
    setSavingMileage(false);
  }

  return (
    <div
      className={clsx(
        "fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-end z-50"
      )}
    >
      <div className="w-full max-w-md h-full bg-white shadow-2xl p-6 overflow-y-auto border-l border-gray-200">
        <h1 className="text-2xl font-semibold tracking-tight">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h1>
        <p className="text-gray-500 text-sm mb-4">Plate: {vehicle.plate}</p>

        <TeslaDivider />

        <TeslaSection label="Vehicle Info">
          <div className="space-y-2 text-sm">
            <p><strong>VIN:</strong> {vehicle.vin}</p>
            <p><strong>Vendor:</strong> {vehicle.vendor ?? "N/A"}</p>
            <p><strong>Mileage:</strong> {vehicle.mileage ?? "N/A"}</p>
          </div>
        </TeslaSection>

        <TeslaDivider />

        <TeslaSection label="Update Mileage">
          <div className="flex space-x-2">
            <input
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Enter mileage…"
            />
            <button
              onClick={saveMileage}
              className="bg-black text-white px-4 rounded-lg"
            >
              {savingMileage ? "Saving…" : "Save"}
            </button>
          </div>
        </TeslaSection>

        <TeslaDivider />

        <TeslaSection label="Tires">
          <button
            onClick={() =>
              window.location.href = `/customer/requests/tire-order?vehicle=${vehicle.id}`
            }
            className="w-full bg-black text-white py-2 rounded-lg"
          >
            Order Tires
          </button>
        </TeslaSection>

        <TeslaDivider />

        {/* AI SECTION */}
        <TeslaSection label="AI Tools">
          <div className="space-y-4">
            <button
              onClick={() => summary.run(vehicle)}
              className="w-full bg-gray-900 text-white py-2 rounded-lg"
            >
              {summary.loading ? "Summarizing…" : "AI Summary"}
            </button>
            {summary.data && (
              <div className="p-3 bg-gray-100 rounded-lg text-sm">
                {summary.data}
              </div>
            )}

            <button
              onClick={() => parts.run(vehicle)}
              className="w-full bg-gray-900 text-white py-2 rounded-lg"
            >
              {parts.loading ? "Detecting Parts…" : "AI Parts Detection"}
            </button>
            {parts.data && (
              <div className="p-3 bg-gray-100 rounded-lg text-sm space-y-1">
                {parts.data.map((p: any, i: number) => (
                  <div key={i}>• {p}</div>
                ))}
              </div>
            )}

            <button
              onClick={() => next.run(vehicle)}
              className="w-full bg-gray-900 text-white py-2 rounded-lg"
            >
              {next.loading ? "Calculating…" : "AI Predict Next Service"}
            </button>
            {next.data && (
              <div className="p-3 bg-gray-100 rounded-lg text-sm">
                {next.data}
              </div>
            )}

            <button
              onClick={() => dmg.run(vehicle)}
              className="w-full bg-red-600 text-white py-2 rounded-lg"
            >
              {dmg.loading ? "Analyzing…" : "AI Damage Detection"}
            </button>
            {dmg.data && (
              <div className="p-3 bg-red-100 rounded-lg text-sm">
                <strong>Possible Damage:</strong> {dmg.data}
              </div>
            )}
          </div>
        </TeslaSection>

        <TeslaDivider />

        <button
          onClick={onClose}
          className="w-full bg-black text-white py-3 rounded-xl mt-6"
        >
          Close
        </button>
      </div>
    </div>
  );
}
