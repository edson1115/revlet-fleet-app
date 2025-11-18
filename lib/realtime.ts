// lib/realtime.ts

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    realtime: { params: { eventsPerSecond: 10 } },
  }
);

type EventType = "INSERT" | "UPDATE" | "DELETE";

/**
 * Subscribe to realtime Postgres changes for service_requests table.
 * This version forces TS to allow "postgres_changes" even on older SDKs.
 */
export function subscribeToServiceRequests(
  events: EventType[],
  handler: (payload: any) => void
) {
  // Cast to ANY to bypass strict typings in older supabase-js versions
  const channel: any = supabase.channel("service-requests");

  for (const ev of events) {
    channel.on(
      "postgres_changes",
      {
        event: ev,
        schema: "public",
        table: "service_requests",
      },
      handler
    );
  }

  channel.subscribe((status: string) => {
    if (status === "SUBSCRIBED") {
      console.log("Realtime subscribed → service_requests");
    }
  });

  return () => supabase.removeChannel(channel);
}
