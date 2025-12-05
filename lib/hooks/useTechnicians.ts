// hooks/useTechnicians.ts
"use client";

import useSWR from "swr";

async function fetcher() {
  const res = await fetch("/api/technicians");
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useTechnicians() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/technicians",
    fetcher
  );

  return {
    technicians: data ?? [],
    isLoading,
    error,
    mutate,
  };
}



