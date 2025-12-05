"use client";

import { useState } from "react";

export default function TeslaTechAssignCard({
  request,
  techs,
  onUpdate,
}: {
  request: any;
  techs: any[];
  onUpdate: () => void;
}) {
  const [saving, setSaving] = useState(false);

  const [techId, setTechId] = useState(request.technician_id || "");
  const [start, setStart] = useState(
    request.scheduled_start_at
      ? request.scheduled_start_at.slice(0, 16)
      : ""
  );
  const [end, setEnd] = useState(
    request.scheduled_end_at
      ? request.scheduled_end_at.slice(0, 16)
      : ""
  );

  async function save() {
    setSaving(true);

    const resp = await fetch(`/api/requests/${request.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        technician_id: techId || null,
        scheduled_start_at: start || null,
        scheduled_end_at: end || null,
        status: "SCHEDULED",
      }),
    });

    setSaving(false);

    if (!resp.ok) {
      const js = await resp.json();
      alert(js.error || "Failed to update");
      return;
    }

    onUpdate();
  }

  return (
    <div className="space-y-6">
      {/* TECH */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Assign Technician
        </label>
        <select
          value={techId}
          onChange={(e) => setTechId(e.target.value)}
          className="w-full border p-2 rounded-md"
        >
          <option value="">— Unassigned —</option>
          {techs.map((t: any) => (
            <option key={t.id} value={t.id}>
              {t.full_name}
            </option>
          ))}
        </select>
      </div>

      {/* START TIME */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Start Time
        </label>
        <input
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="w-full border p-2 rounded-md"
        />
      </div>

      {/* END TIME */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          End Time
        </label>
        <input
          type="datetime-local"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="w-full border p-2 rounded-md"
        />
      </div>

      <button
        disabled={saving}
        onClick={save}
        className="w-full bg-sky-700 text-white py-2 rounded-lg mt-4"
      >
        {saving ? "Saving…" : "Save Schedule"}
      </button>
    </div>
  );
}



