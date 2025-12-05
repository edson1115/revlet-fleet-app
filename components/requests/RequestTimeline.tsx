// components/request/RequestTimeline.tsx
"use client";

import { Clock, CheckCircle, PlayCircle } from "lucide-react";

type Props = {
  request: any;
};

export default function RequestTimeline({ request }: Props) {
  const items = [
    {
      label: "Created",
      time: request.created_at,
      icon: <Clock className="w-4 h-4" />,
    },
    {
      label: "Started",
      time: request.started_at,
      icon: <PlayCircle className="w-4 h-4" />,
    },
    {
      label: "Completed",
      time: request.completed_at,
      icon: <CheckCircle className="w-4 h-4" />,
    },
  ];

  return (
    <div className="border rounded-2xl p-4 bg-white shadow-sm space-y-4">
      <div className="text-xs uppercase text-gray-500">Timeline</div>

      <div className="space-y-4 pl-3">
        {items.map((i, idx) => (
          <div key={idx} className="relative">
            <div className="absolute -left-3 top-1 w-2 h-2 bg-blue-500 rounded-full" />
            <div className="ml-2 flex items-center gap-2 text-sm">
              {i.icon}
              <div className="font-medium">{i.label}</div>
            </div>

            <div className="ml-8 text-xs text-gray-500">
              {i.time ? new Date(i.time).toLocaleString() : "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
