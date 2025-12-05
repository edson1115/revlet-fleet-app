"use client";

import React, { useState } from "react";
import TimelineInteractive from "@/components/dispatch/TimelineInteractive";
import { scheduleRequest } from "@/lib/dispatch/scheduleRequest";

type Technician = {
  id: string;
  name?: string | null;
  full_name?: string | null;
};

export default function TeslaTechAssignCard({
  request,
  techs,
  onUpdate,
}: {
  request: any;
  techs: Technician[];
  onUpdate?: (next: any) => void;
}) {
  const [selectedTech, setSelectedTech] = useState<string | null>(
    request?.technician_id || null
  );

  const [timeRange, setTimeRange] = useState<{
    start: string;
    end: string;
  } | null>(
    request.scheduled_at && request.scheduled_end_at
      ? { start: request.scheduled_at, end: request.scheduled_end_at }
      : null
  );

  const [saving, setSaving] = useState(false);

  async function handleSchedule() {
    if (!selectedTech || !timeRange) {
      alert("Please select a technician and time window.");
      return;
    }

    try {
      setSaving(true);

      await scheduleRequest({
        requestId: request.id,
        technicianId: selectedTech,
        start: timeRange.start,
        end: timeRange.end,
      });

      onUpdate?.({
        technician_id: selectedTech,
        scheduled_at: timeRange.start,
        scheduled_end_at: timeRange.end,
        status: "SCHEDULED",
      });

      alert("Scheduled successfully!");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Scheduling failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm space-y-5">
      <h3 className="text-lg font-semibold">Assign Technician</h3>

      {/* Tech List */}
      <div className="space-y-2">
        {techs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTech(t.id)}
            className={`w-full text-left p-3 rounded-lg border ${
              selectedTech === t.id
                ? "border-[#80FF44] bg-[#80FF44]/10"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            {t.full_name || t.name || "Unnamed Tech"}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <TimelineInteractive onChange={(r) => setTimeRange(r)} />

      {/* Save */}
      <button
        onClick={handleSchedule}
        disabled={!selectedTech || !timeRange || saving}
        className="w-full py-3 rounded-lg bg-black text-white disabled:opacity-40"
      >
        {saving ? "Saving…" : "Schedule"}
      </button>
    </div>
  );
}



