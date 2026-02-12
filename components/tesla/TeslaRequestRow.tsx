"use client";

import { TeslaStatusBadge } from "./TeslaStatusBadge";

export function TeslaRequestRow({ req, onClick }: { req: any; onClick?: () => void }) {
  return (
    <div
      onClick={() => onClick?.()}
      className="cursor-pointer border-b border-gray-200 py-3 px-1 hover:bg-gray-50 transition-all"
    >
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-gray-900">
            {req.type || "Service Request"}
          </h3>
          <p className="text-sm text-gray-500">
            {req.vehicle?.make} {req.vehicle?.model}
            {req.vehicle?.unit_number && ` — Unit ${req.vehicle.unit_number}`}
          </p>
        </div>
        <TeslaStatusBadge status={req.status} />
      </div>
    </div>
  );
}