"use client";

import { useEffect, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";

export function useRequestRealtime(requestId: string, onChange: () => void) {
  // Initialize the browser client once
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  useEffect(() => {
    if (!requestId) return;

    const channel = supabase
      .channel(`request-${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "service_requests",
          filter: `id=eq.${requestId}`,
        },
        () => onChange()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, onChange, supabase]);
}