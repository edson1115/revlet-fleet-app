"use client";

import { Dispatch, SetStateAction } from "react";

type Props = {
  groupBy: string;
  setGroupBy: Dispatch<SetStateAction<string>> | ((val: string) => void);
};

export default function VehicleGroupsToggle({ groupBy, setGroupBy }: Props) {
  const groups = [
    { key: "model", label: "Model" },
    { key: "vendor", label: "Vendor" },
    { key: "status", label: "Status" },
  ];

  return (
    <div className="flex bg-gray-100 p-1 rounded-lg">
      {groups.map((g) => {
        const isActive = groupBy === g.key;
        return (
          <button
            key={g.key}
            onClick={() => setGroupBy(g.key)}
            className={`
              flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all
              ${isActive ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-900"}
            `}
          >
            {g.label}
          </button>
        );
      })}
    </div>
  );
}