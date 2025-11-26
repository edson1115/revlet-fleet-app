// hooks/useActiveRequests.ts
"use client";

import useSWR from "swr";

async function fetcher() {
  const res = await fetch("/api/requests/active");
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useActiveRequests() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/requests/active",
    fetcher,
    { refreshInterval: 5000 }
  );

  return {
    activeRequests: data ?? [],
    isLoading,
    error,
    mutate,
  };
}
