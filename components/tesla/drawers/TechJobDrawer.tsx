"use client";

import { useEffect, useState } from "react";

export function TechJobDrawer({
  open,
  request,
  onClose,
  onChanged,
}: {
  open: boolean;
  request: any | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);

  // Photo states
  const [beforePhotos, setBeforePhotos] = useState<File[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<File[]>([]);

  const [partsUsed, setPartsUsed] = useState("");
  const [notes, setNotes] = useState("");

  if (!open || !request) return null;

  // ----- ACTIONS -----
  async function startJob() {
    setBusy(true);

    const res = await fetch(`/api/tech/requests/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "START" }),
    });

    const js = await res.json();
    setBusy(false);

    if (!js.ok) return alert(js.error);

    await onChanged();
  }

  async function completeJob() {
    setBusy(true);

    const form = new FormData();
    form.append("action", "COMPLETE");
    form.append("parts_used", partsUsed);
    form.append("notes", notes);

    beforePhotos.forEach((f) => form.append("before", f));
    afterPhotos.forEach((f) => form.append("after", f));

    const res = await fetch(`/api/tech/requests/${request.id}`, {
      method: "PATCH",
      body: form,
    });

    const js = await res.json();
    setBusy(false);

    if (!js.ok) return alert(js.error);

    await onChanged();
  }

  // ----- DRAWER UI -----
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose}></div>

      <div className="w-full sm:w-[480px] bg-white h-full shadow-xl p-6 overflow-y-auto animate-slideIn">
        <h2 className="text-xl font-semibold text-gray-900">
          {request.service_type} — {request.vehicle_plate}
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          {request.vehicle_year} {request.vehicle_make} {request.vehicle_model}
        </p>

        {/* START JOB */}
        {request.status === "SCHEDULED" && (
          <button
            className="mt-6 w-full py-3 bg-gray-900 text-white rounded-xl"
            onClick={startJob}
            disabled={busy}
          >
            Start Job
          </button>
        )}

        {/* ACTIVE JOB FORM */}
        {request.status === "IN_PROGRESS" && (
          <>
            {/* Before Photos */}
            <section className="mt-6">
              <h3 className="font-semibold">Before Photos</h3>
              <input
                type="file"
                accept="image/*"
                multiple
                className="mt-2"
                onChange={(e) => setBeforePhotos(Array.from(e.target.files || []))}
              />
            </section>

            {/* After Photos */}
            <section className="mt-6">
              <h3 className="font-semibold">After Photos</h3>
              <input
                type="file"
                accept="image/*"
                multiple
                className="mt-2"
                onChange={(e) => setAfterPhotos(Array.from(e.target.files || []))}
              />
            </section>

            {/* Parts Used */}
            <section className="mt-6">
              <h3 className="font-semibold">Parts Used</h3>
              <textarea
                className="w-full border rounded-xl p-3 mt-2"
                rows={3}
                value={partsUsed}
                onChange={(e) => setPartsUsed(e.target.value)}
              />
            </section>

            {/* Notes */}
            <section className="mt-6">
              <h3 className="font-semibold">Notes</h3>
              <textarea
                className="w-full border rounded-xl p-3 mt-2"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </section>

            {/* Submit */}
            <button
              className="mt-8 w-full py-3 bg-green-600 text-white rounded-xl"
              onClick={completeJob}
              disabled={busy}
            >
              Complete Job
            </button>
          </>
        )}

        {/* Close */}
        <button
          className="mt-4 w-full py-2 bg-gray-100 text-gray-700 rounded-xl"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
