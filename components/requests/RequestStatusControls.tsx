"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RequestStatusControls({
  request,
  onUpdate,
}: {
  request: any;
  onUpdate?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleStatusChange(newStatus: string) {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/requests/${request.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        if (onUpdate) onUpdate();
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
            {request?.status || "UNKNOWN"}
          </span>
        </div>

        {/* Basic Controls Placeholder - expandable later */}
        <div className="text-xs text-gray-400 text-center mt-2">
          Status is managed by automated workflows.
        </div>
      </div>
    </div>
  );
}