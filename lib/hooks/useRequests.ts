// hooks/useRequests.ts
"use client";

import useSWR from "swr";

async function fetcher() {
  const res = await fetch("/api/requests");
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useRequests() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/requests",
    fetcher,
    { refreshInterval: 5000 }
  );

  return {
    requests: data ?? [],
    isLoading,
    error,
    mutate,
  };
}



