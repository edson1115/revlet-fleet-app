"use client";

import { useEffect, useState } from "react";
import TimelineInteractive from "@/components/dispatch/TimelineInteractive";
import { scheduleRequest } from "@/lib/dispatch/scheduleRequest";

export default function AssignClient({
  requestId,
  techs,
  onClose,
}: {
  requestId: string;
  techs: any[];
  onClose?: () => void;
}) {
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<{ start: string; end: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // ⭐ NEW — FULL BUSY SCHEDULE BLOCKS
  const [busyBlocks, setBusyBlocks] = useState<
    { start_at: string; end_at: string }[]
  >([]);

  // ⭐ POLL schedule blocks whenever technician changes
  useEffect(() => {
    if (!selectedTech) return;

    (async () => {
      try {
        const res = await fetch(`/api/schedule/tech?tech_id=${selectedTech}`, {
          credentials: "include",
        });
        const js = await res.json();

        setBusyBlocks(js.blocks || []);
      } catch (err) {
        console.error("Load tech schedule failed:", err);
        setBusyBlocks([]);
      }
    })();
  }, [selectedTech]);

  ////////////////////////////////////////////////////////
  // SAVE
  ////////////////////////////////////////////////////////
  async function handleSave() {
    if (!selectedTech || !timeRange) {
      alert("Pick a technician and a time window");
      return;
    }

    setSaving(true);

    try {
      await scheduleRequest({
        requestId,
        technicianId: selectedTech,
        start: timeRange.start,
        end: timeRange.end,
      });

      onClose?.();
    } catch (e) {
      console.error(e);
      alert("Failed to schedule");
    } finally {
      setSaving(false);
    }
  }

  ////////////////////////////////////////////////////////
  // UI
  ////////////////////////////////////////////////////////

  return (
    <div className="p-4 space-y-6">
      {/* TECH LIST */}
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
            {t.full_name || t.name}
          </button>
        ))}
      </div>

      {/* ✨ TIMELINE WITH BUSY BLOCKS ✨ */}
      <TimelineInteractive
        onChange={(range) => setTimeRange(range)}
        busyBlocks={busyBlocks}
      />

      {/* FOOTER BUTTON */}
      <button
        onClick={handleSave}
        disabled={!selectedTech || !timeRange || saving}
        className="
          w-full py-3 rounded-lg
          bg-[#80FF44] text-black font-semibold
          disabled:opacity-40 disabled:cursor-not-allowed
        "
      >
        {saving ? "Saving…" : "Schedule Request"}
      </button>
    </div>
  );
}