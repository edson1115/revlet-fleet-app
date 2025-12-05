"use client";

import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";
import { TeslaListRow } from "@/components/tesla/TeslaListRow";

export default function OverviewPanel({
  customer,
  customerId,
  onOpenLightbox,
}: {
  customer: any;
  customerId: string;
  onOpenLightbox?: (imgs: any[], i: number) => void;
}) {
  return (
    <div className="space-y-10">

      {/* HEADER */}
      <TeslaSection label="Customer Info">
        <div className="text-sm space-y-1">
          <div className="font-medium text-black">{customer.name}</div>
          <div className="text-gray-600">
            {customer.address || "No address on file"}
          </div>

          <div className="mt-2 text-sm">
            Approval:{" "}
            <span className="font-medium text-indigo-600">
              {customer.approval_type}
            </span>
          </div>
        </div>
      </TeslaSection>

      <TeslaDivider />

      {/* Quick Stats */}
      <TeslaSection label="Summary">
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <div className="text-gray-600">Vehicles</div>
            <div className="text-lg font-semibold">{customer.vehicle_count ?? "—"}</div>
          </div>

          <div>
            <div className="text-gray-600">Open Requests</div>
            <div className="text-lg font-semibold">{customer.open_requests ?? "—"}</div>
          </div>

          <div>
            <div className="text-gray-600">Health Grade</div>
            <div className="text-lg font-semibold text-indigo-600">
              {customer.fleet_grade ?? "—"}
            </div>
          </div>

          <div>
            <div className="text-gray-600">Last Inspection</div>
            <div className="text-lg font-semibold">
              {customer.last_inspection ? new Date(customer.last_inspection).toLocaleDateString() : "—"}
            </div>
          </div>
        </div>
      </TeslaSection>

      <TeslaDivider />

      {/* Recent Requests */}
      <TeslaSection label="Recent Requests">
        {!customer.recent_requests?.length && (
          <div className="text-sm text-gray-500">No requests found.</div>
        )}

        <div className="rounded-xl border border-gray-200 overflow-hidden">
          {customer.recent_requests?.map((r: any) => (
            <TeslaListRow
              key={r.id}
              title={r.service}
              subtitle={`${r.vehicle?.year} ${r.vehicle?.make} ${r.vehicle?.model}`}
              metaLeft={r.status}
              status={r.status}
              onClick={() =>
                window.location.assign(`/office/requests/${r.id}`)
              }
            />
          ))}
        </div>
      </TeslaSection>
    </div>
  );
}
