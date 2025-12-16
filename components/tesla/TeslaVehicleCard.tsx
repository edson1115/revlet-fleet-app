"use client";

export function TeslaVehicleCard({ vehicle, onClick }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-2xl bg-white shadow-sm border border-gray-200 
                 hover:shadow-md transition-all p-5 space-y-3"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h2>
        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
          {vehicle.plate || "No Plate"}
        </span>
      </div>

      <div className="text-sm text-gray-500">
        VIN: <span className="font-mono">{vehicle.vin}</span>
      </div>

      <div className="text-xs text-gray-400">
        Click to view details →
      </div>
    </div>
  );
}
