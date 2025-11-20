// components/tesla/TeslaRequestTimeline.tsx
"use client";

type Props = {
  created?: string | null;
  scheduled?: string | null;
  preferredStart?: string | null;
  preferredEnd?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
};

export function TeslaRequestTimeline({
  created,
  scheduled,
  preferredStart,
  preferredEnd,
  started_at,
  completed_at,
}: Props) {
  const events = [
    {
      label: "Created",
      value: created,
    },
    {
      label: "Scheduled",
      value: scheduled,
    },
    {
      label: "Preferred Window Start",
      value: preferredStart,
    },
    {
      label: "Preferred Window End",
      value: preferredEnd,
    },
    {
      label: "Started",
      value: started_at,
    },
    {
      label: "Completed",
      value: completed_at,
    },
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

            {/* Text */}
            <div>
              <div className="text-sm font-medium text-gray-900">
                {ev.label}
              </div>
              <div className="text-sm text-gray-600">{formatted}</div>
            </div>
          </div>
        );
      })}

      {/* Vertical line (Tesla style) */}
      <div className="border-l border-gray-300 ml-1 h-8" />
    </div>
  );
}
