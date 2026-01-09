"use client";

import { useState, useEffect } from "react";

const IconAlert = () => <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const IconCheck = () => <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconPlus = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;

export function RevenueOptimizer({ 
  request, 
  onUpdate 
}: { 
  request: any;
  onUpdate: (updates: any) => void;
}) {
  const [opportunities, setOpportunities] = useState<any[]>([]);

  // 🧠 THE ENFORCER LOGIC
  useEffect(() => {
    const title = request.service_title?.toLowerCase() || "";
    const desc = request.service_description?.toLowerCase() || "";
    const ops = [];

    // 1. RULE: Tire Rotation is a MUST
    // If it's a service job (implied by title) but "Rotation" isn't mentioned...
    const isServiceJob = title.includes("oil") || title.includes("service") || title.includes("maintenance") || title.includes("brake");
    const hasRotation = title.includes("rotation") || desc.includes("rotation") || title.includes("rotate");
    
    if (isServiceJob && !hasRotation) {
        ops.push({
            id: "tire_rotation",
            label: "Missing Tire Rotation",
            actionText: "Add Rotation (+$29.99)",
            reason: "Standard procedure for all service tickets.",
            apply: (currentDesc: string) => {
                return {
                    service_description: currentDesc ? currentDesc + "\n\n+ Tire Rotation & Inspection" : "+ Tire Rotation & Inspection",
                    // In a real V2, this would also add a line item price to the invoice automatically
                }
            }
        });
    }

    // 2. RULE: Wipers with Oil Changes
    if (title.includes("oil") && !desc.includes("wiper")) {
        ops.push({
            id: "wipers",
            label: "Check Wiper Blades",
            actionText: "Add Wiper Check",
            reason: "High-margin upsell opportunity.",
            apply: (currentDesc: string) => {
                return {
                    service_description: currentDesc ? currentDesc + "\n+ Check/Replace Wiper Blades" : "+ Check/Replace Wiper Blades"
                }
            }
        });
    }

    setOpportunities(ops);
  }, [request.service_title, request.service_description]);

  async function handleApply(op: any) {
    if (!confirm(`Apply "${op.label}" to this ticket?`)) return;

    // Calculate new values
    const updates = op.apply(request.service_description || "");
    
    // Save to server
    const res = await fetch(`/api/office/requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
    });

    if (res.ok) {
        // Trigger parent refresh
        onUpdate(updates); 
    } else {
        alert("Failed to update request.");
    }
  }

  if (opportunities.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 animate-in fade-in slide-in-from-top-2">
       <div className="flex items-center gap-2 mb-3">
          <IconAlert />
          <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wide">Revenue Opportunities Detected</h3>
       </div>
       
       <div className="space-y-2">
          {opportunities.map((op) => (
              <div key={op.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-amber-100 shadow-sm">
                  <div>
                      <div className="font-bold text-sm text-gray-900">{op.label}</div>
                      <div className="text-xs text-gray-500">{op.reason}</div>
                  </div>
                  <button 
                    onClick={() => handleApply(op)}
                    className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 transition flex items-center gap-1 shadow-sm"
                  >
                     <IconPlus /> {op.actionText}
                  </button>
              </div>
          ))}
       </div>
    </div>
  );
}