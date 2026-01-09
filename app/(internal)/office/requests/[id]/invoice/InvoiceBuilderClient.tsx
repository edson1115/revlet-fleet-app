"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

type InvoicePart = {
  id: string;
  name: string;
  qty: number;
  cost: number;
  price: number; 
};

export default function InvoiceBuilderClient({ request }: { request: any }) {
  const router = useRouter();
  
  // --- STATE ---
  // Load existing values if they exist (so you can edit a saved invoice)
  const [laborCost, setLaborCost] = useState<number>(request.invoice_labor_cost || 150.00);
  const [taxRate, setTaxRate] = useState<number>(0.0825);
  const [saving, setSaving] = useState(false);
  
  // Initialize parts
  const [parts, setParts] = useState<InvoicePart[]>(
    request.request_parts.map((p: any) => ({
      id: p.id,
      name: p.part_name,
      qty: p.quantity,
      cost: 0,
      price: 0 // In a V2, we would load saved part prices here
    }))
  );

  // --- CALCULATIONS ---
  const partsTotal = useMemo(() => parts.reduce((acc, p) => acc + (p.price * p.qty), 0), [parts]);
  const subtotal = partsTotal + laborCost;
  const taxAmount = subtotal * taxRate;
  const grandTotal = subtotal + taxAmount;

  const isFinalized = !!request.invoice_finalized_at;

  // --- HANDLERS ---
  const handlePartPriceChange = (id: string, newPrice: string) => {
    const val = parseFloat(newPrice) || 0;
    setParts(prev => prev.map(p => p.id === id ? { ...p, price: val } : p));
  };

  const handlePrint = () => {
    window.print();
  };

  async function handleFinalize() {
    if (!confirm(`Are you sure you want to finalize this invoice for $${grandTotal.toFixed(2)}? This will mark the job as BILLED.`)) return;

    setSaving(true);
    
    const res = await fetch(`/api/office/requests/${request.id}/invoice/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            laborCost,
            partsTotal,
            taxAmount,
            grandTotal,
            partsMarkup: parts // Sending the array if backend wants to store line items later
        })
    });

    if (res.ok) {
        alert("Invoice saved successfully!");
        router.refresh(); // Reload to show "BILLED" status
    } else {
        alert("Error saving invoice.");
    }
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans print:bg-white">
      
      {/* 1. EDITOR BAR */}
      <div className="bg-black text-white px-6 py-4 flex justify-between items-center print:hidden sticky top-0 z-10">
         <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-gray-400 hover:text-white">&larr; Back</button>
            <div>
               <h1 className="font-bold text-lg flex items-center gap-2">
                   Invoice Builder
                   {isFinalized && <span className="bg-green-500 text-black text-[10px] px-2 py-0.5 rounded uppercase font-black">Finalized</span>}
               </h1>
               <p className="text-xs text-gray-400">Request #{request.id.slice(0,6)}</p>
            </div>
         </div>
         <div className="flex gap-3">
            {!isFinalized && (
                <button 
                    onClick={handleFinalize} 
                    disabled={saving}
                    className="px-6 py-2 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 transition disabled:opacity-50"
                >
                    {saving ? "Saving..." : "💾 Save & Finalize"}
                </button>
            )}
            <button onClick={handlePrint} className="px-6 py-2 bg-white text-black text-xs font-bold rounded hover:bg-gray-200 transition">
               🖨️ Print / Save PDF
            </button>
         </div>
      </div>

      {/* 2. INVOICE SHEET */}
      <div className="max-w-[8.5in] mx-auto bg-white min-h-screen shadow-xl print:shadow-none print:w-full p-12 my-8 print:my-0">
         
         {/* HEADER */}
         <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-8">
            <div>
               <h1 className="text-4xl font-black tracking-tighter italic">REVLET</h1>
               <p className="text-xs font-bold uppercase tracking-widest mt-1">Fleet Services</p>
            </div>
            <div className="text-right">
               <h2 className="text-2xl font-bold uppercase text-gray-900">Invoice</h2>
               <p className="text-sm text-gray-500 mt-1">Date: {new Date().toLocaleDateString()}</p>
               <p className="text-sm text-gray-500">
                   Invoice #: {request.invoice_number || "DRAFT"}
               </p>
            </div>
         </div>

         {/* BILL TO & VEHICLE */}
         <div className="grid grid-cols-2 gap-12 mb-12">
            <div>
               <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2">Bill To</h3>
               <div className="text-sm font-bold text-gray-900">{request.customer?.name}</div>
               <div className="text-sm text-gray-600 whitespace-pre-wrap">{request.customer?.address || "No address on file"}</div>
               <div className="text-sm text-gray-600 mt-1">{request.customer?.email}</div>
            </div>
            <div className="text-right">
               <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2">Vehicle Service</h3>
               <div className="text-sm font-bold text-gray-900">{request.vehicle?.year} {request.vehicle?.make} {request.vehicle?.model}</div>
               <div className="text-sm text-gray-600">VIN: {request.vehicle?.vin || "—"}</div>
               <div className="text-sm text-gray-600">Plate: {request.plate || request.vehicle?.plate}</div>
               <div className="mt-2 bg-gray-100 inline-block px-2 py-1 rounded text-xs font-mono font-bold">
                  {request.service_title}
               </div>
            </div>
         </div>

         {/* LINE ITEMS */}
         <table className="w-full mb-8">
            <thead>
               <tr className="border-b-2 border-black">
                  <th className="text-left py-2 text-xs font-black uppercase tracking-wider">Description</th>
                  <th className="text-center py-2 text-xs font-black uppercase tracking-wider w-20">Qty</th>
                  <th className="text-right py-2 text-xs font-black uppercase tracking-wider w-32">Unit Price</th>
                  <th className="text-right py-2 text-xs font-black uppercase tracking-wider w-32">Total</th>
               </tr>
            </thead>
            <tbody className="text-sm">
               {/* LABOR ROW */}
               <tr className="border-b border-gray-100">
                  <td className="py-4 font-bold text-gray-800">
                     Labor / Service Fee
                     <div className="text-xs font-normal text-gray-500 mt-0.5">{request.service_description}</div>
                  </td>
                  <td className="text-center py-4">1</td>
                  <td className="text-right py-4 print:hidden">
                     {isFinalized ? (
                        <span className="font-mono">${laborCost.toFixed(2)}</span>
                     ) : (
                        <input 
                            type="number" 
                            className="w-24 text-right p-1 border rounded bg-yellow-50 focus:bg-white outline-none font-mono"
                            value={laborCost}
                            onChange={(e) => setLaborCost(parseFloat(e.target.value) || 0)}
                        />
                     )}
                  </td>
                  <td className="text-right py-4 font-mono hidden print:table-cell">
                     ${laborCost.toFixed(2)}
                  </td>
                  <td className="text-right py-4 font-mono font-bold">
                     ${laborCost.toFixed(2)}
                  </td>
               </tr>

               {/* PARTS ROWS */}
               {parts.map((part) => (
                  <tr key={part.id} className="border-b border-gray-100">
                     <td className="py-4 font-medium text-gray-700">{part.name}</td>
                     <td className="text-center py-4">{part.qty}</td>
                     <td className="text-right py-4 print:hidden">
                        {isFinalized ? (
                            <span className="font-mono">${part.price.toFixed(2)}</span>
                        ) : (
                            <input 
                                type="number" 
                                className="w-24 text-right p-1 border rounded bg-yellow-50 focus:bg-white outline-none font-mono"
                                placeholder="0.00"
                                value={part.price || ""}
                                onChange={(e) => handlePartPriceChange(part.id, e.target.value)}
                            />
                        )}
                     </td>
                     <td className="text-right py-4 font-mono hidden print:table-cell">
                        ${part.price.toFixed(2)}
                     </td>
                     <td className="text-right py-4 font-mono">
                        ${(part.price * part.qty).toFixed(2)}
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>

         {/* TOTALS */}
         <div className="flex justify-end">
            <div className="w-64 space-y-2">
               <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-mono">${subtotal.toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-sm text-gray-600">
                  <span>Tax ({ (taxRate * 100).toFixed(2) }%)</span>
                  <span className="font-mono">${taxAmount.toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-xl font-black text-black border-t-2 border-black pt-2 mt-2">
                  <span>Total</span>
                  <span>${grandTotal.toFixed(2)}</span>
               </div>
            </div>
         </div>

         {/* FOOTER */}
         <div className="mt-16 pt-8 border-t border-gray-100 text-center">
            <p className="text-sm font-bold text-gray-900">Thank you for your business!</p>
            <p className="text-xs text-gray-500 mt-1">Payment is due upon receipt. Please make checks payable to Revlet Fleet Services.</p>
         </div>

      </div>
    </div>
  );
}