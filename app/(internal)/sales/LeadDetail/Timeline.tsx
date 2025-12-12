"use client";

import { useEffect, useState } from "react";

export default function Timeline({ leadId }: any) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    async function load() {
      const r = await fetch(`/api/sales/leads/${leadId}/updates`);
      const j = await r.json();
      setRows(j.rows || []);
    }
    load();
  }, [leadId]);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Activity</h3>

      <div className="border-l border-gray-300 pl-4 space-y-4">
        {rows.map((u) => (
          <div key={u.id} className="relative">
            <div className="absolute -left-2 top-1 w-3 h-3 bg-blue-500 rounded-full" />
            <div className="text-sm">{u.note}</div>
            <div className="text-xs text-gray-500">
              {new Date(u.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
