"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import TeslaAIScanModal from "@/components/tesla/TeslaAIScanModal";
import TeslaPhotoViewer from "@/components/tesla/TeslaPhotoViewer";

type Vehicle = {
  id: string;
  year?: number | string;
  make?: string;
  model?: string;
  plate?: string;
  vin?: string;
  unit_number?: string;
  mileage_override?: number | null;
  last_reported_mileage?: number | null;
  provider_company_id?: string | null;
  health_photo_1?: string | null;
  health_photo_2?: string | null;
  health_photo_3?: string | null;
};

export default function TeslaVehicleDrawer({
  open,
  vehicle,
  onClose,
}: {
  open: boolean;
  vehicle: Vehicle | null;
  onClose: () => void;
}) {
  // ------------------------------
  // Local UI state
  // ------------------------------
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingReq, setLoadingReq] = useState(false);

  const [aiScan, setAiScan] = useState<any>(null);
  const [scanOpen, setScanOpen] = useState(false);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [providers, setProviders] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  // Editable form (kept stable in hook order)
  const [form, setForm] = useState({
    year: "",
    make: "",
    model: "",
    plate: "",
    vin: "",
    unit_number: "",
    provider_company_id: "",
  });

  // ------------------------------
  // Sync form with selected vehicle
  // ------------------------------
  useEffect(() => {
    if (!vehicle) return;
    setForm({
      year: (vehicle.year as any) ?? "",
      make: vehicle.make ?? "",
      model: vehicle.model ?? "",
      plate: vehicle.plate ?? "",
      vin: vehicle.vin ?? "",
      unit_number: vehicle.unit_number ?? "",
      provider_company_id: vehicle.provider_company_id ?? "",
    });
  }, [vehicle?.id]); // re-sync when switching vehicles

  // ------------------------------
  // Load FMC providers
  // ------------------------------
  useEffect(() => {
    if (!open) return;
    (async () => {
      const r = await fetch("/api/providers/provider-companies", { cache: "no-store" });
      const js = await r.json();
      if (js.ok) setProviders(js.rows || []);
    })();
  }, [open]);

  // ------------------------------
  // Load recent service history
  // ------------------------------
  useEffect(() => {
    if (!open || !vehicle?.id) return;
    (async () => {
      setLoadingReq(true);
      try {
        const res = await fetch(`/api/customer/requests?vehicle_id=${vehicle.id}`, {
          cache: "no-store",
        });
        const js = await res.json();
        if (js.ok) setRequests(js.requests?.slice(0, 5) || []);
      } finally {
        setLoadingReq(false);
      }
    })();
  }, [open, vehicle?.id]);

  // ------------------------------
  // Health photo list (derive fresh each render)
  // ------------------------------
  const healthPhotos: string[] = [
    vehicle?.health_photo_1 || "",
    vehicle?.health_photo_2 || "",
    vehicle?.health_photo_3 || "",
  ].filter(Boolean) as string[];

  // ------------------------------
  // Save edits (inline)
  // ------------------------------
  const saveEdits = useCallback(async () => {
    if (!vehicle?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/customer/vehicles/${vehicle.id}`, {
        method: "PUT",
        credentials: "include",
        body: JSON.stringify(form),
      });
      const js = await res.json();
      if (!js.ok) {
        alert(js.error || "Failed to save");
        return;
      }
      await refreshVehicle();
      setEditOpen(false);
    } finally {
      setSaving(false);
    }
  }, [vehicle?.id, form]);

  // ------------------------------
  // Refresh vehicle (pull latest)
  // ------------------------------
  const refreshVehicle = useCallback(async () => {
    if (!vehicle?.id) return;
    const r = await fetch(`/api/customer/vehicles/${vehicle.id}`, {
      credentials: "include",
      cache: "no-store",
    });
    const js = await r.json();
    if (js.ok) {
      const v = js.vehicle as Vehicle;
      setForm({
        year: (v.year as any) ?? "",
        make: v.make ?? "",
        model: v.model ?? "",
        plate: v.plate ?? "",
        vin: v.vin ?? "",
        unit_number: v.unit_number ?? "",
        provider_company_id: v.provider_company_id ?? "",
      });
      // Keep local vehicle’s health photos visually in sync
      (vehicle as any).health_photo_1 = v.health_photo_1;
      (vehicle as any).health_photo_2 = v.health_photo_2;
      (vehicle as any).health_photo_3 = v.health_photo_3;
    }
  }, [vehicle?.id]);

  // ------------------------------
  // Upload / Replace Health Photos
  // ------------------------------
  async function uploadPhoto(slot: 1 | 2 | 3, file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/uploads/vehicle-health", {
        method: "POST",
        body: fd,
      });
      const js = await res.json();
      if (!js.ok) {
        alert(js.error || "Upload failed");
        return;
      }

      const field =
        slot === 1 ? "health_photo_1" : slot === 2 ? "health_photo_2" : "health_photo_3";

      await fetch(`/api/customer/vehicles/${vehicle?.id}`, {
        method: "PUT",
        credentials: "include",
        body: JSON.stringify({ [field]: js.url }),
      });

      await refreshVehicle();
    } finally {
      setUploading(false);
    }
  }

  function handlePhotoPick(slot: 1 | 2 | 3) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) uploadPhoto(slot, file);
    };
    input.click();
  }

  // ------------------------------
  // Close on ESC
  // ------------------------------
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // ------------------------------
  // Framer motion variants (Tesla gravity)
  // ------------------------------
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  // Overshoot spring to mimic Tesla’s “gravity” feel
  const panelVariants = {
    hidden: { x: "100%" },
    visible: {
      x: 0,
      transition: {
        type: "spring" as const, // FIX: Added "as const"
        stiffness: 600,
        damping: 40,
        mass: 0.8,
        // small overshoot feel
        restDelta: 0.5,
      },
    },
    exit: {
      x: "100%",
      transition: { 
        type: "tween" as const, // FIX: Added "as const"
        duration: 0.22, 
        ease: [0.4, 0, 1, 1] 
      },
    },
  };

  if (!open || !vehicle) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[500] flex justify-end"
        role="dialog"
        aria-modal="true"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={backdropVariants}
        onClick={onClose}
      >
        {/* Stop click-through on the panel itself */}
        <motion.div
          role="document"
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md h-full bg-white p-6 overflow-y-auto shadow-2xl rounded-none md:rounded-l-2xl"
          variants={panelVariants}
        >
          {/* HEADER */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-semibold">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h2>

              <div className="text-sm mt-1 text-gray-600 space-y-1">
                <div>
                  <strong>Unit:</strong> {vehicle.unit_number || "—"}
                </div>
                <div>
                  <strong>Plate:</strong> {vehicle.plate || "—"}
                </div>
                <div>
                  <strong>VIN:</strong> {vehicle.vin || "—"}
                </div>
                <div>
                  <strong>Mileage:</strong>{" "}
                  {vehicle.mileage_override ??
                    vehicle.last_reported_mileage ??
                    "—"}
                </div>
              </div>
            </div>

            <button
              aria-label="Close"
              onClick={onClose}
              className="text-gray-500 hover:text-black"
            >
              ✕
            </button>
          </div>

          {/* EDIT VEHICLE */}
          <button
            onClick={() => setEditOpen((v) => !v)}
            className="w-full mb-6 py-3 bg-gray-100 text-gray-800 rounded-lg font-medium hover:bg-gray-200 transition"
          >
            {editOpen ? "Close Editing" : "Edit Vehicle"}
          </button>

          {editOpen && (
            <div className="p-4 mb-8 bg-gray-50 border rounded-xl space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold">Edit Vehicle</h3>

              <Field
                label="Year"
                value={form.year}
                onChange={(e: any) => setForm({ ...form, year: e.target.value })}
              />
              <Field
                label="Make"
                value={form.make}
                onChange={(e: any) => setForm({ ...form, make: e.target.value })}
              />
              <Field
                label="Model"
                value={form.model}
                onChange={(e: any) => setForm({ ...form, model: e.target.value })}
              />
              <Field
                label="Plate"
                value={form.plate}
                onChange={(e: any) => setForm({ ...form, plate: e.target.value })}
              />
              <Field
                label="Unit Number"
                value={form.unit_number}
                onChange={(e: any) =>
                  setForm({ ...form, unit_number: e.target.value })
                }
              />
              <Field
                label="VIN"
                value={form.vin}
                onChange={(e: any) => setForm({ ...form, vin: e.target.value })}
              />

              {/* Provider (FMC) */}
              <div>
                <label className="text-sm font-medium">
                  Fleet Management Company (FMC)
                </label>
                <select
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  value={form.provider_company_id}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      provider_company_id: e.target.value,
                    })
                  }
                >
                  <option value="">None</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={saveEdits}
                disabled={saving}
                className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-900"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          )}

          {/* VEHICLE HEALTH (3 slots + uploader) */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">Vehicle Health</h3>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[1, 2, 3].map((slot) => {
                const src =
                  slot === 1
                    ? vehicle.health_photo_1
                    : slot === 2
                    ? vehicle.health_photo_2
                    : vehicle.health_photo_3;

                return (
                  <div key={slot} className="relative group">
                    {src ? (
                      <img
                        src={src}
                        className="w-full h-24 object-cover rounded-lg cursor-pointer"
                        onClick={() => {
                          const idx = healthPhotos.indexOf(src);
                          setViewerIndex(idx >= 0 ? idx : 0);
                          setViewerOpen(true);
                        }}
                        alt={`Vehicle health ${slot}`}
                      />
                    ) : (
                      <button
                        type="button"
                        className="w-full h-24 bg-gray-100 border rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200"
                        onClick={() => handlePhotoPick(slot as 1 | 2 | 3)}
                      >
                        + Add
                      </button>
                    )}

                    {src && (
                      <button
                        type="button"
                        onClick={() => handlePhotoPick(slot as 1 | 2 | 3)}
                        className="absolute bottom-1 right-1 bg-white/90 px-2 py-1 text-xs rounded shadow opacity-0 group-hover:opacity-100 transition"
                      >
                        Replace
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {uploading && (
              <div className="text-sm text-gray-500">Uploading photo…</div>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col gap-3 mb-10">
            <Link
              href={`/customer/update-mileage?vehicle_id=${vehicle.id}`}
              className="w-full bg-black text-white py-3 rounded-lg text-center font-medium hover:bg-gray-900"
            >
              Update Mileage
            </Link>

            <Link
              href={`/customer/requests/new?vehicle_id=${vehicle.id}`}
              className="w-full block text-center bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition"
            >
              Create Service Request
            </Link>

            <button
              onClick={() => setScanOpen(true)}
              className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg text-center font-medium hover:bg-gray-300"
            >
              AI Vehicle Scan
            </button>
          </div>

          {/* AI RESULTS */}
          {aiScan && (
            <div className="mb-8 p-4 rounded-xl bg-gray-50 border space-y-3 animate-fade-in">
              <h3 className="font-semibold text-lg">AI Scan Results</h3>

              <div className="text-sm text-gray-700">{aiScan.summary}</div>

              {aiScan.detected_issues?.length > 0 && (
                <SectionList
                  title="Detected Issues"
                  items={aiScan.detected_issues}
                />
              )}

              {aiScan.maintenance_recommendations?.length > 0 && (
                <SectionList
                  title="Maintenance Recommendations"
                  items={aiScan.maintenance_recommendations}
                />
              )}

              {aiScan.parts_suggestions?.length > 0 && (
                <SectionList
                  title="Parts Suggestions"
                  items={aiScan.parts_suggestions}
                />
              )}

              {aiScan.next_service_miles && (
                <div className="text-sm text-gray-800">
                  <strong>Next Service:</strong> {aiScan.next_service_miles}
                </div>
              )}
            </div>
          )}

          {/* RECENT SERVICES */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-3">Recent Services</h3>

            {loadingReq && (
              <div className="text-sm text-gray-500">Loading…</div>
            )}

            {!loadingReq && requests.length === 0 && (
              <div className="text-sm text-gray-400">No service history.</div>
            )}

            <div className="space-y-3">
              {requests.map((r: any) => (
                <Link
                  key={r.id}
                  href={`/customer/requests/${r.id}`}
                  className="block border rounded-lg p-3 hover:bg-gray-50 transition"
                >
                  <div className="font-medium text-gray-800">
                    {r.service_type || "General Service"}
                  </div>

                  <div className="text-sm text-gray-500 flex justify-between mt-1">
                    <span>{new Date(r.created_at).toLocaleDateString()}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-200">
                      {r.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* AI SCAN MODAL */}
          <TeslaAIScanModal
            open={scanOpen}
            vehicleId={vehicle.id}
            onClose={() => setScanOpen(false)}
            onResult={(data) => setAiScan(data)}
          />

          {/* FULL PHOTO VIEWER */}
          {viewerOpen && (
            <TeslaPhotoViewer
              photos={healthPhotos}
              index={viewerIndex}
              onClose={() => setViewerOpen(false)}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* -------------------------------------------------------
   Helper Components
------------------------------------------------------- */

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: any;
  onChange: any;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <input
        value={value}
        onChange={onChange}
        className="w-full border rounded-lg px-3 py-2"
      />
    </div>
  );
}

function SectionList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="font-medium">{title}</h4>
      <ul className="list-disc ml-6 text-sm text-gray-700">
        {items.map((i: any, idx: number) => (
          <li key={idx}>{i}</li>
        ))}
      </ul>
    </div>
  );
}