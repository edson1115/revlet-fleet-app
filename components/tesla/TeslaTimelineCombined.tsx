"use client";

export default function TeslaTimelineCombined({
  events = [],
}: {
  events: Array<{
    label: string;
    ts?: string | null;
  }>;
}) {
  function f(dt?: string | null) {
    if (!dt) return "—";
    const d = new Date(dt);
    if (isNaN(d.getTime())) return dt;
    return d.toLocaleString();
  }

  return (
    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
      {/* HEADER */}
      <div className="px-5 py-4 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-800">Timeline</h3>
      </div>

      {/* BODY */}
      <div className="p-5">
        <div className="relative ml-3 border-l border-gray-300">
          {events.map((ev, i) => (
            <div key={i} className="mb-6 ml-4 relative">
              {/* dot */}
              <div className="absolute -left-4 top-1.5 h-3 w-3 rounded-full bg-black"></div>

              {/* label */}
              <div className="text-sm font-medium text-gray-900">
                {ev.label}
              </div>

              {/* timestamp */}
              <div className="text-xs text-gray-600">
                {ev.ts ? f(ev.ts) : "—"}
              </div>
            </div>
          ))}

          {events.length === 0 && (
            <div className="text-gray-500 text-sm ml-4">No events</div>
          )}
        </div>
      </div>
    </div>
  );
}
