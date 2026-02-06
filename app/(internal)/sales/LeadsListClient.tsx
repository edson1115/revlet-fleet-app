"use client";

import { useEffect, useState } from "react";
import LeadRow from "./LeadRow";
import Drawer from "./LeadDetail/Drawer"; // We created this earlier!

export default function LeadsListClient() {
  // Fix 1: Add <any[]> so TypeScript knows this array holds data
  const [rows, setRows] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/sales/leads");
        const data = await res.json();
        setRows(data.rows || []);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  return (
    <>
      <div className="space-y-4">
        {rows.length === 0 && (
            <div className="text-gray-500 text-sm p-4">Loading leads...</div>
        )}
        
        {rows.map((row) => (
          // Fix 2: Use 'lead' prop to match the LeadRow component
          <LeadRow 
            key={row.id} 
            lead={row} 
            onClick={(l) => setSelectedLead(l)} 
          />
        ))}
      </div>

      {/* Integrate the Drawer we built */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm">
           <div className="w-full max-w-lg bg-white shadow-2xl h-full overflow-y-auto">
              <Drawer 
                lead={selectedLead} 
                onClose={() => setSelectedLead(null)} 
              />
           </div>
        </div>
      )}
    </>
  );
}