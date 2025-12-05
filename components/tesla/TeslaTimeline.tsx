"use client";

import React from "react";
import {
  FiClock,
  FiCheckCircle,
  FiCalendar,
  FiTool,
  FiFlag,
  FiAlertCircle,
} from "react-icons/fi";

export default function TeslaTimeline({
  created,
  waiting,
  approval,
  parts,
  scheduled,
  started,
  completed,
  status,
}: {
  created?: string | null;
  waiting?: string | null;
  approval?: string | null;
  parts?: string | null;
  scheduled?: string | null;
  started?: string | null;
  completed?: string | null;
  status?: string | null;
}) {
  const steps = [
    {
      key: "NEW",
      label: "Created",
      date: created,
      icon: <FiClock />,
    },
    {
      key: "WAITING",
      label: "Waiting",
      date: waiting,
      icon: <FiAlertCircle />,
    },
    {
      key: "WAITING_FOR_APPROVAL",
      label: "Waiting for Approval",
      date: approval,
      icon: <FiCalendar />,
    },
    {
      key: "WAITING_FOR_PARTS",
      label: "Waiting for Parts",
      date: parts,
      icon: <FiTool />,
    },
    {
      key: "SCHEDULED",
      label: "Scheduled",
      date: scheduled,
      icon: <FiCalendar />,
    },
    {
      key: "IN_PROGRESS",
      label: "In Progress",
      date: started,
      icon: <FiTool />,
    },
    {
      key: "COMPLETED",
      label: "Completed",
      date: completed,
      icon: <FiCheckCircle />,
    },
  ];

  function isActive(stepKey: string) {
    const order = [
      "NEW",
      "WAITING",
      "WAITING_FOR_APPROVAL",
      "WAITING_FOR_PARTS",
      "SCHEDULED",
      "IN_PROGRESS",
      "COMPLETED",
    ];
    return order.indexOf(stepKey) <= order.indexOf(status || "NEW");
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4 tracking-tight">Timeline</h3>

      <div className="relative">
        <div className="absolute left-5 top-0 h-full w-[2px] bg-gray-200"></div>

        <ul className="space-y-6">
          {steps.map((s, i) => (
            <li key={i} className="relative flex gap-4">
              <div
                className={`
                  h-10 w-10 rounded-full flex items-center justify-center
                  border bg-white shadow-sm text-gray-700
                  ${
                    isActive(s.key)
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
                  {s.date
                    ? new Date(s.date).toLocaleString()
                    : "—"}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
