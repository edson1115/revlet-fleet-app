// hooks/useVehicles.ts
"use client";

import useSWR from "swr";

async function fetcher() {
  const res = await fetch("/api/vehicles");
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useVehicles() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/vehicles",
    fetcher,
    { refreshInterval: 5000 }
  );

  return {
    vehicles: data ?? [],
    isLoading,
    error,
    mutate,
  };
}
