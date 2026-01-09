"use client";

import { useState, useEffect } from "react";

const IconBox = () => <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;

export function TechPartsList({ requestId }: { requestId: string }) {
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tech/requests/${requestId}/parts`) // We will create this simple endpoint next
      .then(r => r.json())
      .then(d => {
         if (d.ok) setParts(d.parts);
         setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [requestId]);

  if (loading) return <div className="animate-pulse h-12 bg-gray-100 rounded-lg"></div>;
  if (parts.length === 0) return null; // Don't show if empty

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
         <IconBox />
         <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Parts to Install</h3>
      </div>
      <div className="divide-y divide-gray-100">
         {parts.map((part) => (
            <div key={part.id} className="p-4 flex justify-between items-center">
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center font-bold text-sm">
                     {part.quantity}
                  </div>
                  <div>
                     <div className="font-bold text-gray-900">{part.part_name}</div>
                     <div className="text-xs text-gray-500 font-mono">
                        {part.part_number} {part.inventory_id && <span className="text-green-600 font-bold">• In Stock</span>}
                     </div>
                  </div>
               </div>
               <div className="text-xs font-bold text-gray-300">
                  {/* Checkbox visual for tech */}
                  <div className="w-6 h-6 border-2 border-gray-200 rounded-full"></div>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
}