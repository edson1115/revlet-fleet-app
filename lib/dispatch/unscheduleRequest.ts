export async function unscheduleRequest(requestId: string) {
  const res = await fetch(`/api/requests/${requestId}/unschedule`, {
    method: "PATCH",
    credentials: "include",
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to unschedule: ${txt}`);
  }

  return res.json();
}



