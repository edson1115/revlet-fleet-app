"use client";

import { TeslaVehicleCard } from "./TeslaVehicleCard";

export default function TeslaGroupedGrid({ groups, onSelect }: any) {
  return (
    <div className="space-y-10">
      {groups.map((group: any) => (
        <div key={group.id}>
          {/* Heading */}
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {group.name} ({group.count})
          </h2>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
            {group.vehicles.map((v: any) => (
              <TeslaVehicleCard
                key={v.id}
                vehicle={v}
                onClick={() => onSelect(v)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
