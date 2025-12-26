"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { TeslaSection } from "@/components/tesla/TeslaSection";

type Vehicle = {
  id: string;
  unit_number?: string | null;
  plate?: string | null;
  year: number;
  make: string;
  model: string;
  vin?: string | null;
  provider_company_id?: string | null; // FMC ID
  // If you join FMC name, add it here. Otherwise we group by ID or "None"
};

export default function OfficeCustomerFleetClient({
  customer,
  vehicles,
}: {
  customer: any;
  vehicles: Vehicle[];
}) {
  const router = useRouter();

  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [groupByFmc, setGroupByFmc] = useState(false);

  // GROUPING LOGIC
  const groupedVehicles = useMemo(() => {
    if (!groupByFmc) return { "All Vehicles": vehicles };

    return vehicles.reduce((acc, v) => {
      // In a real app, you'd probably join the FMC Name. 
      // For now, we group by "FMC Assigned" vs "Private / None"
      const key = v.provider_company_id ? "FMC Managed" : "Private / Direct";
      if (!acc[key]) acc[key] = [];
      acc[key].push(v);
      return acc;
    }, {} as Record<string, Vehicle[]>);
  }, [vehicles, groupByFmc]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2 font-medium">
            <button 
              onClick={() => router.push("/office/customers")}
              className="hover:text-black hover:underline transition"
            >
              &larr; All Customers
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-black">{customer.name}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-black">
            {customer.name}
          </h1>
          <div className="text-sm text-gray-500 mt-1 flex gap-4">
             <span>{customer.market || "No Market"}</span>
             <span>•</span>
             <span>{vehicles.length} Vehicles</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
             {/* VIEW TOGGLES */}
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                    onClick={() => setGroupByFmc(v => !v)}
                    className={clsx(
                    "text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-md transition-all",
                    groupByFmc ? "bg-white shadow text-black" : "text-gray-500 hover:text-black"
                    )}
                >
                    Group by FMC
                </button>
                <div className="w-px h-4 bg-gray-300 mx-1" />
                <button
                    onClick={() => setViewMode("list")}
                    className={clsx(
                    "text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-md transition-all",
                    viewMode === "list" ? "bg-white shadow text-black" : "text-gray-500 hover:text-black"
                    )}
                >
                    List
                </button>
                <button
                    onClick={() => setViewMode("grid")}
                    className={clsx(
                    "text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-md transition-all",
                    viewMode === "grid" ? "bg-white shadow text-black" : "text-gray-500 hover:text-black"
                    )}
                >
                    Grid
                </button>
            </div>

            {/* ACTION: CREATE REQUEST */}
            <button
                onClick={() => router.push(`/office/requests/new?customer_id=${customer.id}`)}
                className="bg-black text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition shadow-lg shadow-gray-200"
            >
                + New Request
            </button>
        </div>
      </div>

      {/* FLEET LIST */}
      <TeslaSection label="Fleet Vehicles">
        {vehicles.length === 0 && (
             <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                No vehicles in this fleet yet.
             </div>
        )}

        <div className="space-y-8">
            {Object.entries(groupedVehicles).map(([groupName, groupList]) => (
                <div key={groupName}>
                     {/* GROUP HEADER (Only if grouping is active or multiple groups exist) */}
                    {(groupByFmc || Object.keys(groupedVehicles).length > 1) && (
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 pl-1">
                            {groupName} <span className="text-gray-300 ml-2">{groupList.length}</span>
                        </h3>
                    )}

                    {/* GRID VIEW */}
                    {viewMode === "grid" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {groupList.map((v) => (
                                <div key={v.id} className="p-4 bg-white border border-gray-200 rounded-xl hover:border-black transition group cursor-default">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600 group-hover:bg-black group-hover:text-white transition">
                                            {v.unit_number ? `UNIT ${v.unit_number}` : "NO UNIT #"}
                                        </span>
                                        <span className="text-xs font-mono font-medium text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded bg-gray-50">
                                            {v.plate || "NO PLATE"}
                                        </span>
                                    </div>
                                    <div className="font-bold text-lg text-gray-900">{v.year} {v.make} {v.model}</div>
                                    <div className="text-xs text-gray-400 mt-1 truncate">VIN: {v.vin || "—"}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* LIST VIEW (TABLE) */}
                    {viewMode === "list" && (
                        <div className="overflow-hidden border border-gray-200 rounded-xl">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium uppercase text-xs tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3 w-32">Unit #</th>
                                        <th className="px-4 py-3 w-40">Plate</th>
                                        <th className="px-4 py-3">Vehicle</th>
                                        <th className="px-4 py-3 hidden md:table-cell">VIN</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {groupList.map((v) => (
                                        <tr key={v.id} className="bg-white hover:bg-gray-50 transition">
                                            <td className="px-4 py-3 font-bold text-gray-900">
                                                {v.unit_number || "—"}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-gray-600">
                                                {v.plate || "—"}
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                {v.year} {v.make} {v.model}
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 font-mono text-xs hidden md:table-cell">
                                                {v.vin || "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ))}
        </div>
        
        {/* ADD VEHICLE ACTION */}
        <div className="mt-6 pt-6 border-t border-gray-100">
             <button 
                className="text-sm font-bold text-gray-500 hover:text-black flex items-center gap-2 transition"
                onClick={() => router.push(`/office/customers/${customer.id}/add-vehicle`)}
             >
                <span className="text-lg">+</span> Add Vehicle to Fleet
             </button>
        </div>
      </TeslaSection>
    </div>
  );
}