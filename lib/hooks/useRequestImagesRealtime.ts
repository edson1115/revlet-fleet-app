"use client";

import { useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export function useRequestImagesRealtime(requestId: string, onChange: () => void) {
  const supabase = createClientComponentClient();

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
  }, [requestId]);
}



