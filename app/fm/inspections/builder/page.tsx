// app/fm/inspections/builder/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * INSPECTION BUILDER UX
 * - Loads all vehicles for the customer
 * - FM inspects vehicle-by-vehicle
 * - FM submits everything as ONE draft request OR per-vehicle requests
 */

export default function InspectionBuilder() {
  const router = useRouter();
  const search = useSearchParams();

  const customerId = search.get("customer");
  const recurringId = search.get("recurring");

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  const [checklist, setChecklist] = useState<any>({});
  const [photos, setPhotos] = useState<any>({});
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!customerId) return;

    fetch(`/api/portal/customer/${customerId}`)
      .then((r) => r.json())
      .then((res) => {
        setVehicles(res.vehicles || []);
      });
  }, [customerId]);

  if (!customerId) {
    return <div className="p-6">Missing customer…</div>;
  }

  const vehicle = vehicles[currentIdx];

  function toggleItem(section: string, item: string) {
    setChecklist((prev: any) => ({
      ...prev,
      [vehicle.id]: {
        ...(prev[vehicle.id] || {}),
        [section]: {
          ...(prev[vehicle.id]?.[section] || {}),
          [item]: !(prev[vehicle.id]?.[section]?.[item]),
        },
      },
    }));
  }

  async function submitInspection() {
    const payload = {
      customer_id: customerId,
      recurring_id: recurringId,
      findings: checklist,
      notes,
      photos,
    };

    await fetch("/api/fm/inspections/submit", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    alert("Inspection submitted!");
    router.push("/fm/inspections");
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Inspection Builder</h1>

      <p className="text-gray-600">
        Inspect each vehicle and submit final report.
      </p>

      {/* VEHICLE HEADER */}
      {vehicle && (
        <div className="p-4 border rounded bg-gray-50">
          <h2 className="text-xl font-semibold">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h2>
          <p className="text-gray-500">Unit: {vehicle.unit_number}</p>
          <p className="text-gray-500 text-sm">Plate: {vehicle.plate}</p>
        </div>
      )}

      {/* CHECKLIST */}
      <ChecklistSection
        vehicleId={vehicle?.id}
        checklist={checklist}
        toggleItem={toggleItem}
      />

      {/* NOTES */}
      <div>
        <label className="block text-gray-700 font-medium mb-1">
          FM Notes
        </label>
        <textarea
          className="w-full border rounded p-3"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* NAVIGATION */}
      <div className="flex justify-between mt-6">
        <button
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx((i) => i - 1)}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-40"
        >
          Previous Vehicle
        </button>

        {currentIdx < vehicles.length - 1 ? (
          <button
            onClick={() => setCurrentIdx((i) => i + 1)}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Next Vehicle
          </button>
        ) : (
          <button
            onClick={submitInspection}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Submit Inspection
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------
   CHECKLIST COMPONENT
---------------------------------------- */
function ChecklistSection({ vehicleId, checklist, toggleItem }: any) {
  if (!vehicleId) return null;

  const sections = {
    Tires: ["Front Left", "Front Right", "Rear Left", "Rear Right"],
    Brakes: ["Front Pads", "Rear Pads", "Rotors", "Inspection Passed"],
    Fluids: ["Oil Level", "Coolant", "Brake Fluid", "Transmission"],
    Lights: ["Headlights", "Brake Lights", "Turn Signals", "Reverse Lights"],
    General: ["Leaks", "Strange Noises", "Alignment", "Battery Health"],
  };

  return (
    <div className="space-y-4">
      {Object.entries(sections).map(([section, items]) => (
        <div key={section} className="p-4 border rounded">
          <h3 className="font-semibold mb-2">{section}</h3>

          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => {
              const checked =
                checklist?.[vehicleId]?.[section]?.[item] || false;

              return (
                <label
                  key={item}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleItem(section, item)}
                  />
                  {item}
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
