"use client";

import { TeslaStatusBadge } from "./TeslaStatusBadge";

export function TeslaRequestRow({ req, onClick }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer border-b border-gray-200 py-3 px-1 hover:bg-gray-50 transition-all"
    >
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-gray-900">
            {req.service_type || "Service Request"}
          </h3>
          <p className="text-sm text-gray-500">
            {req.vehicle_make} {req.vehicle_model} — {req.vehicle_plate}
          </p>
        </div>
        <TeslaStatusBadge status={req.status} />
      </div>
    </div>
  );
}
