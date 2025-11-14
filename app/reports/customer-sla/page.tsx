// app/reports/customer-sla/page.tsx
"use client";

export default function CustomerSlaReportPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-2">
      <h1 className="text-2xl font-semibold">Customer SLA</h1>
      <p className="text-sm text-gray-600">
        SLA view per fleet customer / FMC – on-time completion %, average
        turnaround, and risk flags for overdue or repeat issues.
      </p>
      <div className="mt-4 rounded-xl border border-dashed px-4 py-6 text-sm text-gray-500">
        Placeholder: we&apos;ll join completed requests with their
        customer and compare actual completion times vs SLA targets.
      </div>
    </div>
  );
}
