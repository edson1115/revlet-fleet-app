"use client";

import { CheckCircle2, Clock } from "lucide-react";

export function TeslaTechAvailability() {
  const techs = [
    { name: "John Smith", status: "Available", zone: "Zone A" },
    { name: "Sarah Miller", status: "On Job", zone: "Zone B" },
  ];

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
      <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Tech Availability</h3>
      <div className="space-y-4">
        {techs.map((tech, i) => (
          <div key={i} className="flex justify-between items-center">
            <div>
              <div className="font-bold text-gray-900">{tech.name}</div>
              <div className="text-[10px] text-gray-400 uppercase font-black">{tech.zone}</div>
            </div>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
              tech.status === "Available" ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"
            }`}>
              {tech.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}