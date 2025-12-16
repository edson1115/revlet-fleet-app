"use client";

import React from "react";
import AssignClient from "@/components/dispatch/assign/ui/AssignClient";

export default function TeslaScheduleCard({
  scheduled_start_at,
  scheduled_end_at,
  requestId,
}: {
  scheduled_start_at?: string | null;
  scheduled_end_at?: string | null;
  requestId: string;
}) {
  function fmt(d?: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="rounded-2xl border bg-white p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Schedule</h3>
        <p className="text-sm text-gray-500">
          Dispatch scheduling & technician assignment
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-500">Start</div>
          <div className="font-medium">{fmt(scheduled_start_at)}</div>
        </div>

        <div>
          <div className="text-gray-500">End</div>
          <div className="font-medium">{fmt(scheduled_end_at)}</div>
        </div>
      </div>

      {/* DISPATCH ASSIGNMENT */}
      <AssignClient requestId={requestId} />
    </div>
  );
}
