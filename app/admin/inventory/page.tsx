"use client";

import { useEffect, useState } from "react";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaListRow } from "@/components/tesla/TeslaListRow";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";
import ReceiveStockModal from "./ReceiveStockModal"; // 👈 Import the Modal

export default function InventoryDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [showReceive, setShowReceive] = useState(false); // 👈 New State for Modal

  async function load() {
    // We don't necessarily need to set loading=true here to avoid UI flicker on refresh
    // but for the initial load we do.
    if (!stats) setLoading(true);
    
    const res = await fetch("/api/admin/inventory", {
      cache: "no-store",
    }).then((r) => r.json());

    if (res.ok) setStats(res.stats);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading || !stats) return <div className="p-8 text-zinc-500 animate-pulse">Loading fleet inventory...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10">

      {/* --- MODAL INJECTION --- */}
      {showReceive && (
          <ReceiveStockModal 
              onClose={() => setShowReceive(false)} 
              onSuccess={() => { 
                  // Reload stats to show the new stock immediately
                  load(); 
              }} 
          />
      )}

      {/* HERO SECTION + ACTION BUTTON */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="flex-1 w-full">
              <TeslaHeroBar
                title="Fleet Inventory + Tire Usage"
                meta={[
                  { label: "Tires in Stock", value: stats.total_stock },
                  { label: "Used This Week", value: stats.used_week },
                  { label: "Top Size", value: stats.top_size },
                  { label: "Vendors", value: stats.vendor_count },
                ]}
              />
          </div>
          
          {/* 🟢 NEW ACTION BUTTON */}
          <button 
             onClick={() => setShowReceive(true)}
             className="mb-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all whitespace-nowrap"
          >
             + Receive Shipment
          </button>
      </div>

      {/* WEEKLY USAGE */}
      <TeslaSection label="Weekly Tire Usage">
      </TeslaSection>

      {/* COMMON TIRE SIZES */}
      <TeslaSection label="Most Common Tire Sizes">
      </TeslaSection>

      {/* MARKET INVENTORY */}
      <TeslaSection label="Market Stock Levels">
        <div className="bg-white rounded-xl divide-y border border-zinc-100">
          {stats.market_stock.map((m: any) => (
            <TeslaListRow
              key={m.market}
              title={m.market}
              value={`${m.stock} tires`}
              href={`/admin/inventory/${m.market_id}`}
            />
          ))}
        </div>
      </TeslaSection>

      <TeslaDivider />

      {/* VENDORS */}
      <TeslaSection label="Vendor Breakdown">
        <div className="bg-white rounded-xl divide-y border border-zinc-100">
          {stats.vendor_breakdown.map((v: any) => (
            <TeslaListRow
              key={v.vendor}
              title={v.vendor}
              value={`${v.count} tires`}
            />
          ))}
        </div>
      </TeslaSection>
    </div>
  );
}