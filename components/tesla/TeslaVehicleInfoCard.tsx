"use client";

export default function TeslaVehicleInfoCard({ vehicle }: { vehicle: any }) {
  if (!vehicle) return null;

  return (
    <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-1 mt-2 text-sm">
      <p>
        <strong>Unit #:</strong> {vehicle.unit_number || "N/A"}
      </p>

      <p>
        <strong>FMC:</strong>{" "}
        {vehicle.provider_name ||
          vehicle.provider_company_id ||
          "None"}
      </p>

      <p>
        <strong>Market:</strong> {vehicle.market || "N/A"}
      </p>

      <p>
        <strong>Year:</strong> {vehicle.year || "N/A"}
      </p>

      <p>
        <strong>Make:</strong> {vehicle.make || "N/A"}
      </p>

      <p>
        <strong>Model:</strong> {vehicle.model || "N/A"}
      </p>

      <p>
        <strong>Plate:</strong> {vehicle.plate || "N/A"}
      </p>
    </div>
  );
}