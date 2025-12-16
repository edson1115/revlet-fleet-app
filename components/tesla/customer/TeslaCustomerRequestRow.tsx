"use client";

import {
  Wrench,
  Truck,
  CircleDollarSign,
} from "lucide-react";
import { TeslaStatusBadge } from "@/components/tesla/TeslaStatusBadge";

function getIcon(type?: string) {
  switch (type) {
    case "TIRE_PURCHASE":
      return <CircleDollarSign size={18} />;
    case "SERVICE":
    default:
      return <Wrench size={18} />;
  }
}

function getTitle(req: any) {
  if (req.type === "TIRE_PURCHASE") return "Tire Purchase";
  return req.service || "Service Request";
}

export function TeslaCustomerRequestRow({ req }: any) {
  const vehicle = req.vehicle;

  return (
    <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="font-semibold text-gray-900 flex items-center gap-3">
            {getIcon(req.type)}
            {getTitle(req)}
            <TeslaStatusBadge status={req.status} />
          </p>

          {vehicle && (
            <p className="text-sm text-gray-500">
              {vehicle.year} {vehicle.make} {vehicle.model} — {vehicle.plate}
            </p>
          )}

          {!vehicle && req.type === "TIRE_PURCHASE" && (
            <p className="text-sm text-gray-500">
              Tire Order • No vehicle assigned
            </p>
          )}
        </div>

        <p className="text-xs text-gray-400">
          {new Date(req.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
