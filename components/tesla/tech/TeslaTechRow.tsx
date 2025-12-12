"use client";

import { TeslaStatusBadge } from "@/components/tesla/TeslaStatusBadge";

export function TeslaTechRow({ req, onClick }: any) {
  return (
    <div
      className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-all"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-3">
            {req.service_type || "Service Request"}
            <TeslaStatusBadge status={req.status} />
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            {req.vehicle_year} {req.vehicle_make} {req.vehicle_model} — {req.vehicle_plate}
          </p>

          <p className="text-xs text-gray-400 mt-1">
            Customer: {req.customer_name}
          </p>
        </div>

        <div className="text-xs text-gray-400">
          {new Date(req.created_at).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
