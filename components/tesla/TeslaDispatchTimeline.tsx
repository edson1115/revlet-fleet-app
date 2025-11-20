// components/tesla/TeslaDispatchTimeline.tsx
"use client";

type Props = {
  dispatched_at?: string | null;
  en_route_at?: string | null;
  arrived_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
};

export function TeslaDispatchTimeline({
  dispatched_at,
  en_route_at,
  arrived_at,
  started_at,
  completed_at,
}: Props) {
  const events = [
    { label: "Dispatched", value: dispatched_at },
    { label: "En Route", value: en_route_at },
    { label: "Arrived On Site", value: arrived_at },
    { label: "Service Started", value: started_at },
    { label: "Service Completed", value: completed_at },
  ];

  return (
    <div className="space-y-6">
      {events.map((ev) => {
        const formatted = ev.value
          ? new Date(ev.value).toLocaleString()
          : "—";

        return (
          <div key={ev.label} className="flex items-start gap-4">
            {/* Dot */}
            <div className="mt-1 h-3 w-3 rounded-full bg-black" />

            {/* Label + Timestamp */}
            <div>
              <div className="text-sm font-medium text-gray-900">
                {ev.label}
              </div>
              <div className="text-sm text-gray-600">{formatted}</div>
            </div>
          </div>
        );
      })}

      {/* Vertical line footer */}
      <div className="border-l border-gray-300 ml-1 h-8" />
    </div>
  );
}
