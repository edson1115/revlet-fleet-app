"use client";

import { useEffect, useState } from "react";
import { TeslaListRow } from "@/components/tesla/TeslaListRow";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";
import Lightbox from "@/components/common/Lightbox";

type Vehicle = {
  id: string;
  make: string | null;
  model: string | null;
  year: number | null;
  plate: string | null;
  vin: string | null;

  last_service_date?: string | null;
  open_requests?: number;
  internal_notes?: string | null;

  images?: Array<{
    id: string;
    url_work: string;
    type: string | null;
  }>;
};

export default function VehiclesPanel({
  customerId,
  onOpenLightbox,
}: {
  customerId: string;
  onOpenLightbox: (images: any[], index: number) => void;
}) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [drawerPhotos, setDrawerPhotos] = useState<any[]>([]);
  const [drawerPhotoIndex, setDrawerPhotoIndex] = useState(0);

  // -----------------------------
  // LOAD VEHICLES
  // -----------------------------
  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/portal/customer/${customerId}/vehicles`, {
        cache: "no-store",
      });

      const data = await res.json();
      setVehicles(data.vehicles || []);
    })();
  }, [customerId]);

  // -----------------------------
  // SAVE INTERNAL NOTES
  // -----------------------------
  async function saveNotes(vehicleId: string) {
    try {
      setSavingNote(true);

      await fetch(`/api/vehicles/${vehicleId}/internal-notes`, {
        method: "POST",
        body: JSON.stringify({ notes: noteDraft }),
      });

      // update local state
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === vehicleId ? { ...v, internal_notes: noteDraft } : v
        )
      );

      alert("Notes saved.");
    } catch (err) {
      alert("Failed to save notes.");
    } finally {
      setSavingNote(false);
    }
  }

  // -----------------------------
  // VEHICLE DETAIL DRAWER
  ------------------------------
  function Drawer() {
    if (!selected) return null;

    const v = selected;

    return (
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex justify-end">
        <div className="w-full max-w-xl bg-white h-full p-6 overflow-y-auto shadow-xl border-l border-gray-200">
          {/* BACK BUTTON */}
          <button className="text-sm text-gray-600 mb-4" onClick={() => setSelected(null)}>
            ← Back
          </button>

          {/* HERO */}
          <TeslaHeroBar
            title={`${v.year || ""} ${v.make || ""} ${v.model || ""}`.trim()}
            meta={[
              { label: "Plate", value: v.plate },
              { label: "VIN", value: v.vin },
              {
                label: "Open Requests",
                value: v.open_requests != null ? String(v.open_requests) : "0",
              },
              {
                label: "Last Service",
                value: v.last_service_date
                  ? new Date(v.last_service_date).toLocaleDateString()
                  : "—",
              },
            ]}
          />

          {/* PHOTOS */}
          <div className="mt-6">
            <TeslaSection label="Photos">
              {!v.images || v.images.length === 0 ? (
                <div className="text-sm text-gray-500">No photos.</div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {v.images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => {
                        setDrawerPhotos(v.images!);
                        setDrawerPhotoIndex(i);
                        onOpenLightbox(v.images!, i);
                      }}
                      className="rounded-lg overflow-hidden border border-gray-200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url_work}
                        alt="vehicle"
                        className="w-full h-24 object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </TeslaSection>
          </div>

          {/* INTERNAL NOTES */}
          <div className="mt-6">
            <TeslaSection label="Internal Notes">
              <textarea
                className="w-full min-h-[120px] bg-[#F5F5F5] rounded-lg p-3 text-sm"
                placeholder="Add internal notes…"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
              />

              <button
                onClick={() => saveNotes(v.id)}
                disabled={savingNote}
                className="mt-3 w-full py-3 bg-black text-white rounded-lg text-sm disabled:opacity-40"
              >
                {savingNote ? "Saving…" : "Save Notes"}
              </button>
            </TeslaSection>
          </div>

          {/* REQUEST BUTTON */}
          <div className="mt-8">
            <button
              onClick={() =>
                (window.location.href = `/fm/requests/new?customer=${customerId}&vehicle=${v.id}`)
              }
              className="w-full py-3 text-center bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
            >
              Create New Request for This Vehicle
            </button>
          </div>

          <div className="h-10" />
        </div>
      </div>
    );
  }

  // -----------------------------
  // MAIN PANEL LIST
  // -----------------------------
  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight mb-6">Vehicles</h2>

      <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
        {vehicles.map((v) => {
          const title = `${v.year || ""} ${v.make || ""} ${v.model || ""}`.trim();
          const subtitle = v.plate || v.vin || "—";

          const meta =
            v.last_service_date
              ? `Last Serviced: ${new Date(v.last_service_date).toLocaleDateString()}`
              : "No service history";

          return (
            <TeslaListRow
              key={v.id}
              title={title}
              subtitle={subtitle}
              metaLeft={meta}
              rightIcon={true}
              onClick={() => {
                setSelected(v);
                setNoteDraft(v.internal_notes || "");
              }}
            />
          );
        })}

        {vehicles.length === 0 && (
          <div className="p-6 text-gray-500 text-sm">No vehicles found.</div>
        )}
      </div>

      {selected && <Drawer />}
    </div>
  );
}
