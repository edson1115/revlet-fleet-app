"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Define flexible props to handle different usage patterns
interface RequestStatusControlsProps {
  // Pattern A (used by RequestDrawer)
  id?: string;
  status?: string;
  refresh?: () => Promise<void> | void;

  // Pattern B (Standard object)
  request?: { id: string; status: string };
  onUpdate?: () => void;
}

export default function RequestStatusControls({
  id,
  status,
  refresh,
  request,
  onUpdate,
}: RequestStatusControlsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Normalize props
  const requestId = id || request?.id;
  const currentStatus = status || request?.status;
  const handleUpdate = refresh || onUpdate;

  async function handleStatusChange(newStatus: string) {
    if (loading || !requestId) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/requests/${requestId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        if (handleUpdate) await handleUpdate();
        router.refresh();
      } else {
        alert("Failed to update status");
      }
    } catch (error) {
      console.error("Status update failed", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
      <h3 className="font-medium text-sm text-gray-900 mb-3">Request Status</h3>
      
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between bg-white p-3 rounded-lg border">
          <span className="text-sm text-gray-500">Current Status</span>
          <span className="text-sm font-bold bg-black text-white px-3 py-1 rounded-full text-xs">
            {currentStatus || "UNKNOWN"}
          </span>
        </div>

        {/* Placeholder for future controls */}
        <div className="text-xs text-gray-400 text-center mt-2">
          Status is managed by automated workflows.
        </div>
      </div>
    </div>
  );
}