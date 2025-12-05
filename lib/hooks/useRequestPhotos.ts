// hooks/useRequestPhotos.ts
import useSWR from "swr";

export function useRequestPhotos(requestId: string) {
  const fetcher = (url: string) =>
    fetch(url, { credentials: "include" }).then((r) => r.json());

  const { data, mutate, error } = useSWR(
    requestId ? `/api/requests/${requestId}/photos/list` : null,
    fetcher
  );

  return {
    photos: data?.rows || [],
    loading: !data && !error,
    error,
    refresh: mutate,
  };
}



