// hooks/usePhotos.ts
"use client";

import useSWR from "swr";

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function usePhotos(requestId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    requestId ? `/api/requests/${requestId}/photos` : null,
    fetcher,
    { refreshInterval: 3000 }
  );

  return {
    photos: data ?? [],
    isLoading,
    error,
    mutate,
  };
}



