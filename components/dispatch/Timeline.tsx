"use client";

import { useMemo } from "react";

export default function Timeline({
  startHour = 6,
  endHour = 20,
}: {
  startHour?: number;
  endHour?: number;
}) {
  // Generate hour marks
  const hours = useMemo(() => {
    const arr = [];
    for (let h = startHour; h <= endHour; h++) arr.push(h);
    return arr;
  }, [startHour, endHour]);

  return (
    <div className="w-full select-none">
      {/* TOP LABEL */}
      <div className="text-xs text-gray-500 mb-2 pl-1 tracking-wide">
        Technician Availability
      </div>

      {/* TIMELINE CONTAINER */}
      <div className="
        w-full bg-white shadow-sm rounded-xl p-4
        border border-gray-100
      ">
        {/* HOURS BAR */}
        <div className="relative w-full h-14 flex items-center">
          
          {/* Gray background bar */}
          <div className="absolute inset-y-0 left-0 right-0 bg-[#F5F5F5] rounded-full" />

          {/* Hour markers */}
          <div className="relative w-full flex justify-between px-1">
            {hours.map((h) => (
              <div
                key={h}
                className="flex flex-col items-center text-gray-600"
              >
                {/* marker line */}
                <div className="w-[1px] h-4 bg-gray-300 mb-1" />
                {/* time label */}
                <span className="text-[10px] text-gray-500">{h}:00</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tesla subtle footer line */}
        <div className="mt-3 h-[1px] bg-gray-200 w-full" />
      </div>
    </div>
  );
}



