// lib/dispatch/scheduleRequest.ts
"use client";

type ScheduleArgs = {
  requestId: string;
  technicianId: string;
  start: string; // ISO
  end: string;   // ISO
};

/**
 * Schedules a single request. Used by:
 * - AssignDrawer
 * - TimelineInteractive
 * - Tech drag/drop
 */
export async function scheduleRequest(args: ScheduleArgs) {
  const { requestId, technicianId, start, end } = args;

  if (!requestId) throw new Error("Missing requestId");
  if (!technicianId) throw new Error("Missing technicianId");
  if (!start || !end) throw new Error("Missing start/end");

  // --------------------------
  // Update service_request
  // --------------------------
  const res = await fetch(`/api/requests/${encodeURIComponent(requestId)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      technician_id: technicianId,
      scheduled_at: start,
      scheduled_end_at: end,
      status: "SCHEDULED",
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  // --------------------------
  // Insert / Update schedule block
  // --------------------------
  const res2 = await fetch("/api/schedule/block", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      request_id: requestId,
      technician_id: technicianId,
      start_at: start,
      end_at: end,
    }),
  });

  if (!res2.ok) {
    throw new Error("Failed to create schedule block");
  }

  return { ok: true };
}



