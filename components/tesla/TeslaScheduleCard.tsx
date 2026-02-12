"use client";

import React from "react";
import AssignClient from "@/components/dispatch/assign/ui/AssignClient";

interface TeslaScheduleCardProps {
  // Pattern A (Direct props)
  scheduled_start_at?: string | null;
  scheduled_end_at?: string | null;
  requestId?: string;

  // Pattern B (Object prop from TeslaDrawer)
  request?: any;
  techs?: any[];
  onRefresh?: () => void;
}

export default function TeslaScheduleCard(props: TeslaScheduleCardProps) {
  // Normalize props
  const reqId = props.requestId || props.request?.id;
  const start = props.scheduled_start_at || props.request?.scheduled_start_at;
  const end = props.scheduled_end_at || props.request?.scheduled_end_at;

  // Extract technician info safely for AssignClient
  // We try to get it from the request object if available
  const technicianId = props.request?.technician_id || props.request?.technician?.id || null;
  const technicianInitial = props.request?.technician || null;

  function fmt(d?: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (!reqId) return null;

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
          <div className="font-medium">{fmt(start)}</div>
        </div>

        <div>
          <div className="text-gray-500">End</div>
          <div className="font-medium">{fmt(end)}</div>
        </div>
      </div>

      {/* DISPATCH ASSIGNMENT */}
      <AssignClient 
        requestId={reqId} 
        technicianId={technicianId}
        initial={technicianInitial}
        onClose={props.onRefresh}
      />
    </div>
  );
}