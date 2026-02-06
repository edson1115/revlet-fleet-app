"use client";

import { useEffect, useState } from "react";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";
import { TeslaSection } from "@/components/tesla/TeslaSection";
import { TeslaListRow } from "@/components/tesla/TeslaListRow";
import { TeslaDivider } from "@/components/tesla/TeslaDivider";
import ReceiveStockModal from "./ReceiveStockModal";

export default function InventoryDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [showReceive, setShowReceive] = useState(false);

  async function load() {
    if (!stats) setLoading(true);
    
    try {
        const res = await fetch("/api/admin/inventory", {
          cache: "no-store",
        }).then((r) => r.json());

        if (res && res.stats) {
            setStats(res.stats);
        } else {
             // Fallback to prevent crash if API is missing
             setStats({ total_stock: 0, used_week: 0, top_size: "-", vendor_count: 0, market_stock: [], vendor_breakdown: [] });
        }
    } catch (e) {
        setStats({ total_stock: 0, used_week: 0, top_size: "-", vendor_count: 0, market_stock: [], vendor_breakdown: [] });
    } finally {
        setLoading(false);
    }
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
                  load(); 
                  setShowReceive(false);
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
          
          <button 
             onClick={() => setShowReceive(true)}
             className="mb-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all whitespace-nowrap"
          >
              + Receive Shipment
          </button>
      </div>

      {/* WEEKLY USAGE */}
      <TeslaSection label="Weekly Tire Usage">
        <div className="p-4 text-gray-400 italic text-sm">
          No usage data recorded this week.
        </div>
      </TeslaSection>

      {/* COMMON TIRE SIZES */}
      <TeslaSection label="Most Common Tire Sizes">
         <div className="p-4 text-gray-400 italic text-sm">
           Data collecting...
         </div>
      </TeslaSection>

      {/* MARKET INVENTORY */}
      <TeslaSection label="Market Stock Levels">
        <div className="bg-white rounded-xl divide-y border border-zinc-100">
          {stats.market_stock.map((m: any) => (
            <TeslaListRow
              key={m.market}
              title={m.market}
              subtitle={`${m.stock} tires`} 
              onClick={() => window.location.href = `/admin/inventory/${m.market_id}`}
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
              subtitle={`${v.count} tires`}
            />
          ))}
        </div>
      </TeslaSection>
    </div>
  );
}