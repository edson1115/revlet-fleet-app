// hooks/useRequest.ts
"use client";

import useSWR from "swr";

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useRequest(requestId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    requestId ? `/api/requests/${requestId}` : null,
    fetcher
  );

  return {
    request: data ?? null,
    isLoading,
    error,
    mutate,
  };
}
