// lib/dispatch/scheduleRequest.ts

export async function scheduleRequest({
  requestId,
  technicianId,
  start,
  end,
}: {
  requestId: string;
  technicianId: string;
  start: string; // ISO datetime
  end: string;   // ISO datetime
}) {
  // 1) Create a schedule_block
  const blockRes = await fetch(`/api/schedule/set`, {
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

  if (!blockRes.ok) {
    const err = await blockRes.text();
    throw new Error(`Failed to create schedule block: ${err}`);
  }

  // 2) Update the service_request row
  const patchRes = await fetch(`/api/requests/${requestId}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "SCHEDULED",
      technician_id: technicianId,
      scheduled_at: start,
      scheduled_end_at: end,
    }),
  });

  if (!patchRes.ok) {
    const err = await patchRes.text();
    throw new Error(`Failed to update request: ${err}`);
  }

  return patchRes.json();
}
