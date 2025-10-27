// lib/realtime.ts
"use client";

import { supabaseBrowser } from "@/lib/supabase/client";

export type RealtimeUnsub = () => void;

type EventType = "*" | "INSERT" | "UPDATE" | "DELETE";
type SubOpts = {
  /** Which events to listen to (default: "*") */
  events?: EventType | EventType[];
  /** Debounce ms to coalesce rapid bursts (default: 150ms) */
  debounceMs?: number;
};

/** Internal: tiny debounce wrapper */
function debounce(fn: () => void, ms: number) {
  if (ms <= 0) return fn;
  let t: any;
  return () => {
    clearTimeout(t);
    t = setTimeout(fn, ms);
  };
}

/**
 * Subscribe to changes on public.service_requests.
 * Calls onChange() when an INSERT/UPDATE/DELETE arrives.
 *
 * Usage:
 *   const unsub = subscribeServiceRequests(() => reload(), { events: ["INSERT","UPDATE"] });
 */
export function subscribeServiceRequests(
  onChange: () => void,
  opts?: SubOpts
): RealtimeUnsub {
  const events = Array.isArray(opts?.events) ? opts!.events : [opts?.events ?? "*"];
  const handler = debounce(onChange, opts?.debounceMs ?? 150);

  const channel = supabaseBrowser.channel("sr-changes");

  for (const ev of events) {
    channel.on(
      "postgres_changes",
      { event: ev as EventType, schema: "public", table: "service_requests" },
      handler
    );
  }

  channel.subscribe();

  return () => {
    supabaseBrowser.removeChannel(channel);
  };
}

/**
 * Subscribe to notes for a single request (public.request_notes).
 * Calls onChange() when any matching note row changes.
 *
 * Usage:
 *   const unsub = subscribeRequestNotes(requestId, () => reloadNotes());
 */
export function subscribeRequestNotes(
  requestId: string,
  onChange: () => void,
  opts?: SubOpts
): RealtimeUnsub {
  const events = Array.isArray(opts?.events) ? opts!.events : [opts?.events ?? "*"];
  const handler = debounce(onChange, opts?.debounceMs ?? 150);

  const channel = supabaseBrowser.channel(`notes-${requestId}`);

  for (const ev of events) {
    channel.on(
      "postgres_changes",
      {
        event: ev as EventType,
        schema: "public",
        table: "request_notes",
        // server-side filter so we only get this request's notes
        filter: `request_id=eq.${requestId}`,
      },
      handler
    );
  }

  channel.subscribe();

  return () => {
    supabaseBrowser.removeChannel(channel);
  };
}
