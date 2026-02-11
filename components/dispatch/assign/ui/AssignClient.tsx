"use client";

import React, { useEffect, useState, useCallback } from "react";
import TimelineInteractive from "@/components/dispatch/TimelineInteractive";
// Ensure this import path exists; if not, you might need to adjust it or create the file.
import { scheduleRequest } from "@/lib/dispatch/scheduleRequest"; 
import { supabaseBrowser } from "@/lib/supabase/client"; // Updated to use standard client

type Block = {
  id?: string;
  technician_id: string;
  request_id: string;
  start_at: string;
  end_at: string;
};

export default function AssignClient({
  requestId,
  technicianId,
  initial,
  onClose,
}: {
  requestId: string;
  technicianId: string | null;
  initial: any;
  onClose?: () => void;
}) {
  const supabase = supabaseBrowser();

  /////////////////////////////////////////////////////////////////
  // STATE
  /////////////////////////////////////////////////////////////////
  const [selectedTech, setSelectedTech] = useState<string | null>(
    technicianId || null
  );

  const [timeRange, setTimeRange] = useState<{
    start: string;
    end: string;
  } | null>(null);

  const [busyBlocks, setBusyBlocks] = useState<Block[]>([]);
  const [conflicts, setConflicts] = useState<Block[]>([]);
  const [conflictCheckLoading, setConflictCheckLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  /////////////////////////////////////////////////////////////////
  // 28D — PRELOAD PREVIOUS WINDOW IF RESCHEDULE
  /////////////////////////////////////////////////////////////////
  useEffect(() => {
    if (!initial) return;

    if (initial.status === "RESCHEDULE") {
      if (initial.scheduled_at && initial.scheduled_end_at) {
        console.log(
          "PRELOAD WINDOW:",
          initial.scheduled_at,
          initial.scheduled_end_at
        );

        setTimeRange({
          start: initial.scheduled_at,
          end: initial.scheduled_end_at,
        });
      }
    }
  }, [initial]);

  /////////////////////////////////////////////////////////////////
  // LOAD BUSY BLOCKS FOR THIS TECHNICIAN
  /////////////////////////////////////////////////////////////////
  const loadBusyBlocks = useCallback(async () => {
    if (!selectedTech) return;

    try {
      const res = await fetch(
        `/api/schedule/tech?tech_id=${encodeURIComponent(selectedTech)}`,
        { credentials: "include" }
      );
      const js = await res.json();
      setBusyBlocks(js.blocks || []);
    } catch (err) {
      console.error("FAILED TO LOAD BUSY BLOCKS", err);
      setBusyBlocks([]);
    }
  }, [selectedTech]);

  /////////////////////////////////////////////////////////////////
  // CHECK CONFLICTS
  /////////////////////////////////////////////////////////////////
  async function checkConflicts(range: { start: string; end: string }) {
    if (!selectedTech) return;

    setConflictCheckLoading(true);

    try {
      const resp = await fetch("/api/schedule/conflicts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          technician_id: selectedTech,
          start_at: range.start,
          end_at: range.end,
          request_id: requestId, // prevent self-conflict
        }),
      });

      const js = await resp.json();
      setConflicts(js.blocks || []);
    } catch (e) {
      console.error("CONFLICT CHECK FAILED", e);
      setConflicts([]);
    } finally {
      setConflictCheckLoading(false);
    }
  }

  /////////////////////////////////////////////////////////////////
  // LOAD BLOCKS + REALTIME SYNC
  /////////////////////////////////////////////////////////////////
  useEffect(() => {
    loadBusyBlocks();

    if (!supabase || !selectedTech) return;

    const channel = supabase
      .channel(`assign-busyblocks-${selectedTech}`)
      .on(
        "postgres_changes",
        { schema: "public", table: "schedule_blocks", event: "*" },
        () => loadBusyBlocks()
      )
      .subscribe();

    // Explicit cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, selectedTech, loadBusyBlocks]);

  /////////////////////////////////////////////////////////////////
  // HANDLE TIMELINE CHANGE
  /////////////////////////////////////////////////////////////////
  function handleTimeRange(range: { start: string; end: string }) {
    setTimeRange(range);
    checkConflicts(range);
  }

  /////////////////////////////////////////////////////////////////
  // 28E — SAVE SCHEDULED START + END TIME
  /////////////////////////////////////////////////////////////////
  async function handleSave() {
    if (!selectedTech || !timeRange) {
      alert("Pick a technician and a time window");
      return;
    }

    if (conflicts.length > 0) {
      alert("⚠️ This time conflicts with another job.");
      return;
    }

    setSaving(true);

    try {
      await scheduleRequest({
        requestId,
        technicianId: selectedTech,
        start: timeRange.start,
        end: timeRange.end, // full window now saved
      });

      if (onClose) onClose();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to schedule request");
    } finally {
      setSaving(false);
    }
  }

  /////////////////////////////////////////////////////////////////
  // RENDER
  /////////////////////////////////////////////////////////////////
  return (
    <div className="p-5 space-y-6 select-none">

      {/* TECH HEADER */}
      <div>
        <div className="text-xs uppercase text-gray-400 mb-2">Technician</div>
        <button
          disabled
          className="w-full p-3 border rounded-lg bg-black text-white font-semibold opacity-80"
        >
          {selectedTech ? "Assigned Technician" : "No tech selected"}
        </button>
      </div>

      {/* TIMELINE */}
      <div>
        <div className="text-xs uppercase text-gray-400 mb-2">
          Select Time Window
        </div>

        <TimelineInteractive
          busyBlocks={busyBlocks}
          onChange={handleTimeRange}
          // FIX: Map start/end to start_at/end_at
          current={
            timeRange
              ? { start_at: timeRange.start, end_at: timeRange.end }
              : undefined
          }
        />
      </div>

      {/* CONFLICT WARNING */}
      {conflicts.length > 0 && (
        <div className="text-red-600 text-sm p-2 border border-red-400 bg-red-50 rounded-lg">
          ⚠️ This time overlaps with another job.
        </div>
      )}

      {/* SAVE */}
      <button
        onClick={handleSave}
        disabled={
          !selectedTech ||
          !timeRange ||
          conflicts.length > 0 ||
          saving ||
          conflictCheckLoading
        }
        className="
          w-full py-3 rounded-lg font-semibold
          bg-[#80FF44] text-black
          disabled:opacity-40 disabled:cursor-not-allowed
        "
      >
        {saving ? "Saving…" : "Schedule Request"}
      </button>
    </div>
  );
}