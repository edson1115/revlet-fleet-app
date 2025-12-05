"use client";

import React from "react";

export default function TeslaLaborCard({
  estHours,
  actualMinutes,
}: {
  estHours: number;
  actualMinutes: number;
}) {
  const estMinutes = estHours * 60;
  const pct = Math.min(100, (actualMinutes / estMinutes) * 100);

  const remaining = Math.max(0, estMinutes - actualMinutes);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b bg-gray-50 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">Labor Estimate</h3>
        <span className="px-2 py-0.5 text-[10px] rounded-full bg-black text-white tracking-wide">
          {estHours} hr est.
        </span>
      </div>

      <div className="p-5 space-y-4">

        {/* Key-Value Rows */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Estimated:</span>
            <span className="font-medium">{estHours} hrs</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Actual:</span>
            <span className="font-medium">{(actualMinutes / 60).toFixed(1)} hrs</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Remaining:</span>
            <span className="font-medium">{(remaining / 60).toFixed(1)} hrs</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-black transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {pct.toFixed(0)}% complete
          </div>
        </div>

      </div>
    </div>
  );
}



