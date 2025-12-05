// components/request/RequestVehicleCard.tsx
"use client";

type Props = {
  vehicle?: {
    unit_number?: string | null;
    year?: number | null;
    make?: string | null;
    model?: string | null;
    plate?: string | null;
    vin?: string | null;
  } | null;
};

export default function RequestVehicleCard({ vehicle }: Props) {
  if (!vehicle) return null;

  return (
    <div className="border rounded-2xl bg-white p-4 shadow-sm">
      <div className="text-xs uppercase text-gray-500 mb-1">Vehicle</div>

      <div className="text-lg font-semibold">
        {vehicle.year} {vehicle.make} {vehicle.model}
      </div>

      <div className="text-sm text-gray-600 mt-1">
        Unit #{vehicle.unit_number || "—"}
      </div>

      <div className="text-sm text-gray-600">
        Plate: {vehicle.plate || "—"}
      </div>

      <div className="text-xs text-gray-400 mt-2">
        VIN: {vehicle.vin || "—"}
      </div>
    </div>
  );
}
