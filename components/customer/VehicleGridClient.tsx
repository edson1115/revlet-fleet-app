"use client";

import { useState } from "react";
import { TeslaVehicleCard } from "@/components/tesla/TeslaVehicleCard";
import TeslaVehicleDrawer from "@/components/tesla/TeslaVehicleDrawer";

export default function VehicleGridClient({ groups }) {
  const [activeGroup, setActiveGroup] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const total = groups.reduce((sum, g) => sum + g.count, 0);

  const visibleGroups =
    activeGroup === "all"
      ? groups
      : groups.filter((g) => g.id === activeGroup);

  return (
    <div className="space-y-8">
      {/* GROUP TABS */}
      <div className="flex gap-3 flex-wrap">
        <button
          className={`px-4 py-2 rounded-full ${
            activeGroup === "all"
              ? "bg-black text-white"
              : "border"
          }`}
          onClick={() => setActiveGroup("all")}
        >
          All ({total})
        </button>

        {groups.map((g) => (
          <button
            key={g.id}
            onClick={() => setActiveGroup(g.id)}
            className={`px-4 py-2 rounded-full ${
              activeGroup === g.id ? "bg-black text-white" : "border"
            }`}
          >
            {g.name} ({g.count})
          </button>
        ))}
      </div>

      {/* VEHICLE GROUPS */}
      {visibleGroups.map((group) => (
        <div key={group.id}>
          <h3 className="font-semibold text-lg mb-3 text-gray-800">
            {group.name}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {group.vehicles.map((v) => (
              <TeslaVehicleCard
                key={v.id}
                vehicle={v}
                onClick={() => {
                  setSelectedVehicle(v);
                  setDrawerOpen(true);
                }}
              />
            ))}
          </div>
        </div>
      ))}

      <TeslaVehicleDrawer
        open={drawerOpen}
        vehicle={selectedVehicle}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
