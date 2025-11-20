"use client";

import React from "react";
import { FiClock, FiCheckCircle, FiCalendar } from "react-icons/fi";

export default function TeslaTimeline({
  created,
  scheduled,
  preferredStart,
  preferredEnd,
  status,
}: {
  created?: string | null;
  scheduled?: string | null;
  preferredStart?: string | null;
  preferredEnd?: string | null;
  status?: string | null;
}) {
  const steps = [
    {
      label: "Created",
      date: created,
      icon: <FiClock className="text-gray-600" />,
      active: true,
    },
    {
      label: "Preferred Window",
      date:
        preferredStart && preferredEnd
          ? `${new Date(preferredStart).toLocaleString()} → ${new Date(
              preferredEnd
            ).toLocaleString()}`
          : null,
      icon: <FiCalendar className="text-gray-600" />,
      active: !!(preferredStart || preferredEnd),
    },
    {
      label: "Scheduled",
      date: scheduled ? new Date(scheduled).toLocaleString() : null,
      icon: <FiCheckCircle className="text-gray-600" />,
      active: !!scheduled,
    },
  ];

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4 tracking-tight">Timeline</h3>

      <div className="relative">
        {/* Vertical bar */}
        <div className="absolute left-5 top-0 h-full w-[2px] bg-gray-200"></div>

        <ul className="space-y-6">
          {steps.map((s, i) => (
            <li key={i} className="relative flex gap-4">
              <div
                className={`
                  h-10 w-10 rounded-full flex items-center justify-center
                  border text-gray-700 bg-white shadow-sm
                  ${
                    s.active
                      ? "border-black text-black"
                      : "opacity-40 border-gray-300"
                  }
                `}
              >
                {s.icon}
              </div>

              <div>
                <div className="text-sm font-medium">{s.label}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {s.date ?? "—"}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
