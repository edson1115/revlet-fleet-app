"use client";

import { useEffect, useState } from "react";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";
import Lightbox from "@/components/common/Lightbox";

type Props = {
  vehicleId: string;
  onClose: () => void;
  onOpenRequest: (requestId: string) => void; 
};

type Vehicle = {
  id: string;
  customer_id: string;
  year: number | null;
  make: string | null;
  model: string | null;
  plate: string | null;
  vin: string | null;
  unit_number?: string | null;
  internal_notes?: string | null;
};

type Request = {
  id: string;
  service: string | null;
  status: string;
  created_at: string | null;
};

export default function VehicleDrawer({ vehicleId, onClose, onOpenRequest }: Props) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);

  // Photos
  const [photos, setPhotos] = useState<any[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Notes
  const [notes, setNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);

  // -------------------------------------------------
  // LOAD VEHICLE + REQUESTS + IMAGES
  // -------------------------------------------------
  useEffect(() => {
    async function load() {
      const v = await fetch(`/api/vehicles/${vehicleId}`).then((r) => r.json());
      const r = await fetch(`/api/requests?vehicle=${vehicleId}`).then((r) => r.json());
      const imgs = await fetch(`/api/vehicles/${vehicleId}/images`).then((r) => r.json());

      setVehicle(v.data || null);
      setRequests(r.rows || []);
      setPhotos(imgs.rows || []);

      if (v?.data?.internal_notes) {
        setNotes(v.data.internal_notes);
      }
    }
    load();
  }, [vehicleId]);

  async function saveNotes() {
    setNotesSaving(true);
    const res = await fetch(`/api/vehicles/${vehicleId}/update-notes`, {
      method: "POST",
      body: JSON.stringify({ internal_notes: notes }),
    });
    setNotesSaving(false);
    setHasChanged(false);
    if (!res.ok) alert("Failed to save notes");
  }

  if (!vehicle) return null;

  const title = `${vehicle.year || ""} ${vehicle.make || ""} ${vehicle.model || ""}`.trim();

  return (
    <div className="fixed inset-0 z-[600] bg-black/20 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-xl bg-white h-full border-l border-gray-200 p-6 overflow-y-auto shadow-xl relative">

        {/* Close */}
        <button onClick={onClose} className="text-sm text-gray-600 mb-4">
          ← Back
        </button>

        {/* Header */}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-gray-600 text-sm mt-1">
          {vehicle.plate || vehicle.vin || ""}
        </p>

        <TeslaDivider className="my-6" />

        {/* ---------------------- VEHICLE DETAILS ---------------------- */}
        <TeslaSection label="Vehicle Details">
          <div className="text-sm space-y-2">
            <div><span className="font-medium">Year:</span> {vehicle.year ?? "—"}</div>
            <div><span className="font-medium">Make:</span> {vehicle.make ?? "—"}</div>
            <div><span className="font-medium">Model:</span> {vehicle.model ?? "—"}</div>
            <div><span className="font-medium">Unit #:</span> {vehicle.unit_number ?? "—"}</div>
            <div><span className="font-medium">Plate:</span> {vehicle.plate ?? "—"}</div>
            <div><span className="font-medium">VIN:</span> {vehicle.vin ?? "—"}</div>
          </div>
        </TeslaSection>

        <TeslaDivider className="my-6" />

        {/* ---------------------- INTERNAL NOTES ---------------------- */}
        <TeslaSection label="Internal Notes">
          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setHasChanged(true);
            }}
            className="w-full bg-[#F5F5F5] rounded-lg px-3 py-3 text-sm min-h-[120px]"
          />

          <button
            onClick={saveNotes}
            disabled={!hasChanged || notesSaving}
            className={`mt-3 px-4 py-2 rounded-lg text-sm font-semibold 
              ${hasChanged ? "bg-black text-white" : "bg-gray-300 text-gray-500"}`}
          >
            {notesSaving ? "Saving…" : "Save Notes"}
          </button>
        </TeslaSection>

        <TeslaDivider className="my-6" />

        {/* ---------------------- REQUEST HISTORY ---------------------- */}
        <TeslaSection label="Recent Requests">
          {requests.length === 0 && (
            <div className="text-gray-500 text-sm">No requests found.</div>
          )}

          <div className="space-y-3">
            {requests.map((r) => (
              <button
                key={r.id}
                onClick={() => onOpenRequest(r.id)}
                className="w-full text-left border rounded-lg p-3 hover:bg-gray-50"
              >
                <div className="font-medium text-sm">{r.service || "Service Request"}</div>
                <div className="text-xs text-gray-500">{r.status}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {r.created_at ? new Date(r.created_at).toLocaleString() : ""}
                </div>
              </button>
            ))}
          </div>
        </TeslaSection>

        <TeslaDivider className="my-6" />

        {/* ---------------------- PHOTOS ---------------------- */}
        <TeslaSection label="Vehicle Photos">
          {!photos.length && (
            <div className="text-gray-500 text-sm">No photos.</div>
          )}

          <div className="grid grid-cols-3 gap-2">
            {photos.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => {
                  setLightboxIndex(idx);
                  setLightboxOpen(true);
                }}
                className="rounded-lg overflow-hidden border border-gray-200"
              >
                <img src={p.url_work} className="w-full h-24 object-cover" />
              </button>
            ))}
          </div>

          <Lightbox
            open={lightboxOpen}
            images={photos}
            index={lightboxIndex}
            onIndex={setLightboxIndex}
            onClose={() => setLightboxOpen(false)}
          />
        </TeslaSection>

        <div className="h-10" />
      </div>
    </div>
  );
}



