"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Provider {
  id: string;
  name: string;
  count: number;
}

export function FilterBar({
  providers,
  onFilter,
}: {
  providers: Provider[];
  onFilter: (providerId: string) => void;
}) {
  const [active, setActive] = useState("all");
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  const handleSelect = (id: string) => {
    setActive(id);
    onFilter(id);
  };

  return (
    <div className="sticky top-0 z-20 bg-gray-50 py-3 border-b">
      {/* Mobile Dropdown */}
      <div className="sm:hidden">
        <select
          className="w-full p-2 border rounded-lg bg-white"
          value={active}
          onChange={(e) => handleSelect(e.target.value)}
        >
          <option value="all">All ({providers.reduce((t, p) => t + p.count, 0)})</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.count})
            </option>
          ))}
        </select>
      </div>

      {/* Desktop Chip Bar */}
      <div className="hidden sm:flex gap-3 overflow-x-auto scrollbar-hide py-1">
        {/* ALL Chip */}
        <button
          onClick={() => handleSelect("all")}
          className={`relative px-4 py-1 rounded-full border transition ${
            active === "all"
              ? "bg-black text-white border-black"
              : "bg-white text-gray-700 border-gray-300"
          }`}
        >
          All ({providers.reduce((t, p) => t + p.count, 0)})

          {active === "all" && (
            <motion.div
              layoutId="active-chip"
              className="absolute inset-0 rounded-full bg-black/10 -z-10"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
        </button>

        {/* Provider Chips */}
        {providers.map((p) => (
          <button
            key={p.id}
            onClick={() => handleSelect(p.id)}
            className={`relative px-4 py-1 rounded-full border whitespace-nowrap transition ${
              active === p.id
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-300"
            }`}
          >
            {p.name} ({p.count})

            {active === p.id && (
              <motion.div
                layoutId="active-chip"
                className="absolute inset-0 rounded-full bg-black/10 -z-10"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
