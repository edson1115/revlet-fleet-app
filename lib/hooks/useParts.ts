// hooks/useParts.ts
"use client";

import useSWR from "swr";

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useParts(requestId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    requestId ? `/api/requests/${requestId}/parts` : null,
    fetcher,
    { refreshInterval: 3000 }
  );

  return {
    parts: data ?? [],
    isLoading,
    error,
    mutate,
  };
}



