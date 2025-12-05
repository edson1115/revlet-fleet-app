"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import AssignClient from "@/components/dispatch/assign/ui/AssignClient";

export default function TeslaScheduleCard({
  request,
  techs,
  onRefresh,
}: {
  request: any;
  techs: any[];
  onRefresh?: () => void;
}) {
  const [assignOpen, setAssignOpen] = useState(false);

  // NEW FIELD NAMES
  const tech = request?.assigned_tech || null;
  const start = request?.scheduled_start_at || null;
  const end = request?.scheduled_end_at || null;

  function fmt(dt?: string | null) {
    if (!dt) return "—";
    try {
      return format(new Date(dt), "MMM d, h:mm aaa");
    } catch {
      return dt;
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm space-y-5 border border-gray-200">
      <h3 className="text-lg font-semibold">Schedule</h3>

      {/* Technician Row */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Technician</span>
        <span className="font-medium">
          {tech?.full_name || tech?.name || "Not Assigned"}
        </span>
      </div>

      {/* Time Window */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Time Window</span>
        <span className="font-medium">
          {start ? fmt(start) : "—"} {end ? ` → ${fmt(end)}` : ""}
        </span>
      </div>

      {/* Edit Button */}
      <button
        onClick={() => setAssignOpen(true)}
        className="
          w-full py-3 rounded-lg
          bg-black text-white font-semibold
          hover:bg-gray-900 transition
        "
      >
        {start ? "Edit Schedule" : "Schedule"}
      </button>

      {/* Overlay */}
      {assignOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-center items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAssignOpen(false);
          }}
        >
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
            <AssignClient
              requestId={request.id}
              technicianId={request.assigned_tech?.id}
              onClose={() => {
                setAssignOpen(false);
                onRefresh?.();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}



