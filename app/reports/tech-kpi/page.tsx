// app/reports/tech-kpi/page.tsx
"use client";

export default function TechKpiReportPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-2">
      <h1 className="text-2xl font-semibold">Technician KPIs</h1>
      <p className="text-sm text-gray-600">
        High-level performance metrics per technician, scoped by location:
        jobs completed, average completion time, send-back rate, and photo
        compliance.
      </p>
      <div className="mt-4 rounded-xl border border-dashed px-4 py-6 text-sm text-gray-500">
        Placeholder: we&apos;ll aggregate completed requests by
        technician and date range, then show cards + tables per tech.
      </div>
    </div>
  );
}



