"use client";

import React from "react";
import clsx from "clsx";

// Data for the features
const features = [
  {
    id: "01",
    label: "FINANCE_MOD",
    title: "Instant Invoicing",
    description: "Turn work orders into paid invoices in seconds. Auto-calculate taxes, labor, and parts markup instantly.",
    color: "yellow", // accent color
  },
  {
    id: "02",
    label: "INVENTORY_SYNC",
    title: "Real-Time Inventory",
    description: "Never run out of oil filters again. Real-time deduction when techs close jobs, with low-stock alerts.",
    color: "green",
  },
  {
    id: "03",
    label: "FIELD_OPS",
    title: "Tech Mobile App",
    description: "Give your technicians a purpose-built tool. VIN scanning, photo uploads, and digital inspections.",
    color: "blue",
  },
];

export default function FeatureTiles() {
  return (
    <section className="bg-black py-24 px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="mb-16">
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">
            System Capabilities
          </h2>
          <div className="h-1 w-24 bg-zinc-800 rounded-full" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.id}
              className="group relative h-full bg-zinc-900/50 border border-zinc-800 p-8 overflow-hidden hover:border-zinc-600 transition-all duration-300"
            >
              {/* --- 1. Background Grid Effect --- */}
              <div 
                className="absolute inset-0 opacity-[0.03]" 
                style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
              />

              {/* --- 2. Technical Header (HUD Style) --- */}
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                    SYS_ID // {f.id}
                  </span>
                  <span className={clsx(
                    "font-mono text-[10px] font-bold uppercase tracking-widest mt-1",
                    f.color === 'yellow' ? "text-yellow-500" : 
                    f.color === 'green' ? "text-emerald-500" : "text-blue-500"
                  )}>
                    [{f.label}]
                  </span>
                </div>
                {/* Status Dot */}
                <div className={clsx(
                  "w-2 h-2 rounded-full animate-pulse",
                  f.color === 'yellow' ? "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" : 
                  f.color === 'green' ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                )} />
              </div>

              {/* --- 3. Content --- */}
              <div className="relative z-10 mt-auto">
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tight mb-3 group-hover:translate-x-1 transition-transform">
                  {f.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed border-l-2 border-zinc-800 pl-4 group-hover:border-zinc-600 transition-colors">
                  {f.description}
                </p>
              </div>

              {/* --- 4. Hover Glow Effect (Bottom Right) --- */}
              <div className={clsx(
                "absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity duration-500",
                f.color === 'yellow' ? "bg-yellow-500" : 
                f.color === 'green' ? "bg-emerald-500" : "bg-blue-500"
              )} />

              {/* --- 5. Technical Corner Brackets --- */}
              {/* Top Left */}
              <div className="absolute top-0 left-0 w-4 h-4 border-l border-t border-zinc-700 group-hover:border-white/50 transition-colors" />
              {/* Bottom Right */}
              <div className="absolute bottom-0 right-0 w-4 h-4 border-r border-b border-zinc-700 group-hover:border-white/50 transition-colors" />

            </div>
          ))}
        </div>
      </div>
    </section>
  );
}