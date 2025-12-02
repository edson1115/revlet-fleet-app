// lib/scheduling/setSchedule.ts
export async function setSchedule({
  requestId,
  technicianId,
  start,
  end,
}: {
  requestId: string;
  technicianId: string;
  start: string; // ISO
  end: string;   // ISO
}) {
  const res = await fetch("/api/schedule/set", {
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

  const js = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = js?.error || "Scheduling failed";
    throw new Error(msg);
  }

  return js;
}
