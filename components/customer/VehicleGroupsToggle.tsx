// components/customer/VehicleGroupsToggle.tsx
"use client";

export default function VehicleGroupsToggle({ groupBy, setGroupBy }) {
  const groups = [
    { key: "model", label: "Model" },
    { key: "vendor", label: "Vendor" },
    { key: "yard", label: "Yard" },
    { key: "status", label: "Status" },
    { key: "tags", label: "Tags" },
    { key: "smart", label: "Smart AI" },
  ];

  return (
    <div className="flex gap-2 border rounded-xl p-2 bg-white shadow-sm">
      {groups.map((g) => (
        <button
          key={g.key}
          onClick={() => setGroupBy(g.key)}
          className={`
            px-3 py-1 rounded-lg text-sm transition 
            ${groupBy === g.key 
              ? "bg-black text-white" 
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"}
          `}
        >
          {g.label}
        </button>
      ))}
    </div>
  );
}
