"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { TeslaServiceCard } from "./TeslaServiceCard";
import { TeslaSection } from "./TeslaSection";
import { TeslaKV } from "./TeslaKV";

type Vehicle = {
  id: string;
  year: number | null;
  make: string | null;
  model: string | null;
  unit_number: string | null;
  plate: string | null;
  vin: string | null;
  notes_internal?: string | null;
  customer?: {
    id: string;
    name: string | null;
  } | null;
};

type Props = {
  id: string;
  onClose: () => void;
};

export function TeslaVehicleDrawer({ id, onClose }: Props) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  // LOAD VEHICLE DETAILS
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/vehicles/${id}`, {
          cache: "no-store",
        });

        const js = await res.json();
        if (res.ok) {
          setVehicle(js?.vehicle || null);
        } else {
          console.error(js.error);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    })();
  }, [id]);

  // ------------------------------------------------------------------
  // UI - SLIDE-IN DRAWER (RIGHT SIDE)
  // ------------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* BACKDROP */}
      <div
        onClick={onClose}
        className="flex-1 bg-black/40 backdrop-blur-sm cursor-pointer"
      />

      {/* DRAWER PANEL */}
      <div
        className={clsx(
          "w-[380px] max-w-full bg-white h-full shadow-xl border-l border-gray-200",
          "transform translate-x-0 transition-transform duration-300 ease-out"
        )}
      >
        <div className="p-6 pb-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">
            Vehicle Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black transition"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">

          {/* LOADING */}
          {loading && (
            <div className="text-gray-500 text-sm">Loading…</div>
          )}

          {/* NO DATA */}
          {!loading && !vehicle && (
            <div className="text-red-600 text-sm">Vehicle not found.</div>
          )}

          {/* CONTENT */}
          {vehicle && (
            <>
              {/* Vehicle Summary */}
              <TeslaServiceCard title="Summary">
                <TeslaSection label="Year / Make / Model">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </TeslaSection>

                <TeslaSection label="Unit #">
                  <TeslaKV k="Unit Number" v={vehicle.unit_number || "—"} />
                </TeslaSection>

                <TeslaSection label="Identification">
                  <TeslaKV k="Plate" v={vehicle.plate || "—"} />
                  <TeslaKV k="VIN" v={vehicle.vin || "—"} />
                </TeslaSection>

                <TeslaSection label="Customer">
                  {vehicle.customer?.name || "—"}
                </TeslaSection>
              </TeslaServiceCard>

              {/* Notes */}
              <TeslaServiceCard title="Internal Notes">
                <div className="text-sm text-gray-600 whitespace-pre-wrap">
                  {vehicle.notes_internal || "No notes."}
                </div>
              </TeslaServiceCard>

              {/* Actions */}
              <TeslaServiceCard title="Actions">
                <button
                  onClick={() =>
                    window.location.assign(`/office/vehicles/${vehicle.id}`)
                  }
                  className="w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900"
                >
                  Open Vehicle Page
                </button>

                <button
                  onClick={() =>
                    window.location.assign(
                      `/office/requests/create?vehicle=${vehicle.id}`
                    )
                  }
                  className="w-full mt-2 bg-gray-100 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  Create Service Request
                </button>
              </TeslaServiceCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}



