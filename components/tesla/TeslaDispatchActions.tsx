// components/tesla/TeslaDispatchActions.tsx
"use client";

import { useState } from "react";

type Props = {
  id: string;

  dispatched_at?: string | null;
  en_route_at?: string | null;
  arrived_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;

  onUpdated?: () => void; // callback to refetch
};

export function TeslaDispatchActions({
  id,
  dispatched_at,
  en_route_at,
  arrived_at,
  started_at,
  completed_at,
  onUpdated,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function send(action: string) {
    setLoading(true);

    await fetch(`/api/requests/${id}/dispatch-action`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    setLoading(false);
    onUpdated?.();
  }

  return (
    <div className="space-y-3">

      {/* DISPATCHED */}
      <button
        disabled={!!dispatched_at || loading}
        onClick={() => send("DISPATCHED")}
        className={`w-full px-4 py-2 rounded-lg text-white 
          ${dispatched_at ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-900"}`}
      >
        {dispatched_at ? "Tech Dispatched" : "Send Tech"}
      </button>

      {/* EN ROUTE */}
      <button
        disabled={!dispatched_at || !!en_route_at || loading}
        onClick={() => send("EN_ROUTE")}
        className={`w-full px-4 py-2 rounded-lg text-white
          ${en_route_at ? "bg-gray-400 cursor-not-allowed" : !dispatched_at ? "bg-gray-300 cursor-not-allowed" : "bg-black hover:bg-gray-900"}`}
      >
        {en_route_at ? "En Route" : "Mark En Route"}
      </button>

      {/* ARRIVED */}
      <button
        disabled={!en_route_at || !!arrived_at || loading}
        onClick={() => send("ARRIVED")}
        className={`w-full px-4 py-2 rounded-lg text-white
          ${arrived_at ? "bg-gray-400" : !en_route_at ? "bg-gray-300 cursor-not-allowed" : "bg-black hover:bg-gray-900"}`}
      >
        {arrived_at ? "Arrived On Site" : "Mark Arrived"}
      </button>

      {/* STARTED */}
      <button
        disabled={!arrived_at || !!started_at || loading}
        onClick={() => send("STARTED")}
        className={`w-full px-4 py-2 rounded-lg text-white
          ${started_at ? "bg-gray-400" : !arrived_at ? "bg-gray-300 cursor-not-allowed" : "bg-black hover:bg-gray-900"}`}
      >
        {started_at ? "Service Started" : "Start Service"}
      </button>

      {/* COMPLETED */}
      <button
        disabled={!started_at || !!completed_at || loading}
        onClick={() => send("COMPLETED")}
        className={`w-full px-4 py-2 rounded-lg text-white
          ${completed_at ? "bg-gray-400" : !started_at ? "bg-gray-300 cursor-not-allowed" : "bg-black hover:bg-gray-900"}`}
      >
        {completed_at ? "Completed" : "Complete Job"}
      </button>

    </div>
  );
}
