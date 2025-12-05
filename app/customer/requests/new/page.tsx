"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Lightbox from "@/components/common/Lightbox";

export default function CustomerNewRequestPage() {
  const router = useRouter();

  // ---------------------------
  // STATE
  // ---------------------------
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehicleId, setVehicleId] = useState("");

  const [serviceDesc, setServiceDesc] = useState("");

  // Optional fields
  const [poNumber, setPoNumber] = useState("");
  const [vendor, setVendor] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [keyDrop, setKeyDrop] = useState(false);
  const [parkingLocation, setParkingLocation] = useState("");

  const [dateRequested, setDateRequested] = useState("");

  const [photos, setPhotos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [lbOpen, setLbOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // ---------------------------
  // LOAD VEHICLES
  // ---------------------------
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/customer/requests/new", {
          cache: "no-store",
        });
        const js = await res.json();
        if (!res.ok) throw new Error(js.error);
        setVehicles(js.vehicles || []);
      } catch (e: any) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---------------------------
  // DEFAULT NEXT BUSINESS DAY
  // ---------------------------
  useEffect(() => {
    const today = new Date();
    const day = today.getDay(); // 0-6

    const next = new Date();

    if (day >= 1 && day <= 4) next.setDate(today.getDate() + 1);
    else if (day === 5) next.setDate(today.getDate() + 3);
    else next.setDate(today.getDate() + (8 - day));

    setDateRequested(next.toISOString().split("T")[0]);
  }, []);

  // ---------------------------
  // IMAGES
  // ---------------------------
  function onSelectPhotos(e: any) {
    const files = Array.from(e.target.files || []);
    setPhotos((prev) => [...prev, ...files]);
    setPreviewUrls((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
  }

  // ---------------------------
  // SUBMIT HANDLER (FIXED)
  // ---------------------------
  async function submit() {
    if (!vehicleId) return alert("Please select a vehicle.");
    if (!serviceDesc.trim()) return alert("Please describe the service needed.");

    const form = new FormData();
    form.append("vehicle_id", vehicleId);
    form.append("service", serviceDesc);
    form.append("date_requested", dateRequested);

    form.append("po_number", poNumber);
    form.append("vendor", vendor);
    form.append("urgent", urgent ? "true" : "false");
    form.append("key_drop", keyDrop ? "true" : "false");
    form.append("parking_location", parkingLocation);

    photos.forEach((p) => form.append("photos", p));

    let res;
    try {
      res = await fetch("/api/customer/requests/create", {
        method: "POST",
        body: form,
      });
    } catch (err) {
      console.error("Fetch failed:", err);
      return alert("Network error");
    }

    let js;
    try {
      js = await res.json();
    } catch (err) {
      console.error("Invalid JSON:", err);
      return alert("Server returned invalid response");
    }

    if (!res.ok) {
      console.error("Insert error:", js);
      alert("Insert failed:\n" + JSON.stringify(js, null, 2));
      return;
    }

    router.push(`/customer/requests/${js.request_id}`);
  }

  // ---------------------------
  // RENDER
  // ---------------------------
  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8">
      <a href="/customer/requests" className="text-sm text-blue-600 underline">
        ← Back to Requests
      </a>

      <h1 className="text-3xl font-semibold">Create New Service Request</h1>

      {/* VEHICLE */}
      <div className="space-y-1">
        <label className="block text-sm font-medium">Vehicle</label>
        <select
          className="w-full border rounded-lg p-3 bg-gray-50"
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
        >
          <option value="">Select a vehicle…</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.year} {v.make} {v.model} — Unit {v.unit_number} — {v.plate}
            </option>
          ))}
        </select>
      </div>

      {/* DATE */}
      <div>
        <label className="block text-sm font-medium">Preferred Date</label>
        <input
          type="date"
          className="w-full border rounded-lg p-3 bg-gray-50"
          value={dateRequested}
          onChange={(e) => setDateRequested(e.target.value)}
        />
      </div>

      {/* SERVICE DESCRIPTION */}
      <div>
        <label className="block text-sm font-medium">Describe the service needed</label>
        <textarea
          className="w-full border rounded-lg p-3 min-h-[120px] bg-gray-50"
          value={serviceDesc}
          onChange={(e) => setServiceDesc(e.target.value)}
          placeholder="Describe the issue…"
        />
      </div>

      {/* OPTION FIELDS */}
      <div>
        <label className="block text-sm font-medium">PO Number (optional)</label>
        <input
          className="w-full border rounded-lg p-3 bg-gray-50"
          value={poNumber}
          onChange={(e) => setPoNumber(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Vendor / FMC (optional)</label>
        <input
          className="w-full border rounded-lg p-3 bg-gray-50"
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Options</label>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={urgent} onChange={() => setUrgent(!urgent)} />
          Urgent Request
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={keyDrop} onChange={() => setKeyDrop(!keyDrop)} />
          Key Drop
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium">Parking Location</label>
        <input
          className="w-full border rounded-lg p-3 bg-gray-50"
          value={parkingLocation}
          onChange={(e) => setParkingLocation(e.target.value)}
        />
      </div>

      {/* PHOTOS */}
      <div>
        <label className="block text-sm font-medium">Photos (optional)</label>
        <input type="file" multiple accept="image/*" onChange={onSelectPhotos} />

        {previewUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            {previewUrls.map((src, i) => (
              <button
                key={i}
                onClick={() => {
                  setLbIndex(i);
                  setLbOpen(true);
                }}
                className="border rounded-lg overflow-hidden"
              >
                <img src={src} className="w-full h-24 object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <Lightbox
        open={lbOpen}
        images={previewUrls.map((url) => ({ url_work: url }))}
        index={lbIndex}
        onIndex={setLbIndex}
        onClose={() => setLbOpen(false)}
      />

      {/* BUTTON */}
      <button
        className="w-full py-3 rounded-xl bg-black text-white font-semibold hover:bg-gray-900"
        onClick={submit}
      >
        Submit Request
      </button>
    </div>
  );
}
