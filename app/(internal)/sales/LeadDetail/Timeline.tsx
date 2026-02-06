"use client";

import { useEffect, useState } from "react";

export default function Timeline({ leadId }: any) {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        if (!leadId) return;
        const r = await fetch(`/api/sales/leads/${leadId}/updates`);
        const j = await r.json();
        setRows(j.rows || []);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, [leadId]);

  return (
    <div className="space-y-4 p-4">
      <h3 className="font-semibold text-lg">Activity</h3>

      <div className="border-l border-gray-300 pl-4 space-y-6 ml-2">
        {rows.length === 0 && (
            <div className="text-sm text-gray-400 italic">No activity recorded yet.</div>
        )}

        {rows.map((u) => (
          <div key={u.id} className="relative">
            {/* Dot on the timeline */}
            <div className="absolute -left-[21px] top-1.5 w-3 h-3 bg-blue-500 rounded-full ring-4 ring-white" />
            
            <div className="text-sm text-gray-900">{u.note}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {new Date(u.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}