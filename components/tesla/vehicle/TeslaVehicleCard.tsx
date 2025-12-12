"use client";

export function TeslaVehicleCard({ vehicle, onClick }) {
  return (
    <div
      className="rounded-xl bg-white border shadow-sm p-4 cursor-pointer hover:shadow-md transition"
      onClick={onClick}
    >
      <div className="font-medium text-lg">{vehicle.year} {vehicle.make} {vehicle.model}</div>
      <div className="text-sm text-gray-500">{vehicle.plate}</div>
    </div>
  );
}
