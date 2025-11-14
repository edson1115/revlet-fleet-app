// app/reports/location-metrics/page.tsx
"use client";

export default function LocationMetricsReportPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-2">
      <h1 className="text-2xl font-semibold">Location metrics</h1>
      <p className="text-sm text-gray-600">
        Roll-up view per market / location (Bay Area, San Antonio, etc.):
        volume, completion rate, mix of services, and basic revenue
        proxies.
      </p>
      <div className="mt-4 rounded-xl border border-dashed px-4 py-6 text-sm text-gray-500">
        Placeholder: we&apos;ll group requests by location and show
        trends over time to help decide staffing and expansion.
      </div>
    </div>
  );
}
