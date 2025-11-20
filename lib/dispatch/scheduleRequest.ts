// lib/dispatch/scheduleRequest.ts

export async function scheduleRequest({
  requestId,
  technicianId,
  start,
  end,
}: {
  requestId: string;
  technicianId: string;
  start: string; // "14:30"
  end: string;   // "15:15"
}) {
  const res = await fetch(`/api/requests/${requestId}/schedule`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      technician_id: technicianId,
      start_time: start,
      end_time: end,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to schedule: ${err}`);
  }

  return res.json();
}
