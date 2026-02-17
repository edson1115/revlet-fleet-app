"use client";

import { useEffect, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";

export function useRequestImagesRealtime(requestId: string, onChange: () => void) {
  // Initialize the browser client
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  useEffect(() => {
    if (!requestId) return;

    const channel = supabase
      .channel(`request-images-${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "request_images",
          filter: `request_id=eq.${requestId}`,
        },
        () => onChange()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, onChange, supabase]);
}