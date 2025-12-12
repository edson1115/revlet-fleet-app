"use client";

import { TeslaStatusBadge } from "@/components/tesla/TeslaStatusBadge";

export function TeslaCustomerRequestRow({ req, onClick }: any) {
  return (
    <div
      className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900 flex items-center gap-3">
            {req.service_type}
            <TeslaStatusBadge status={req.status} />
          </p>

          <p className="text-sm text-gray-500 mt-1">
            {req.vehicle_year} {req.vehicle_make} {req.vehicle_model} — {req.vehicle_plate}
          </p>
        </div>

        <p className="text-xs text-gray-400">
          {new Date(req.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
