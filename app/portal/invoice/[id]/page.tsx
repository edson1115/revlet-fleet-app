"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

// --- ICONS ---
const IconCheck = () => <svg className="w-16 h-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

export default function PublicInvoicePage() {
  const params = useParams();
  const id = params?.id as string; // Handle potential array or undefined
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/portal/invoices/${id}`)
      .then(r => r.json())
      .then(d => {
        if(d.ok) setData(d.invoice);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="p-10 text-center font-bold text-gray-400">Loading Invoice...</div>;
  if (!data) return <div className="p-10 text-center font-bold text-red-500">Invoice not found.</div>;

  const { customer, vehicle, parts, financials, shop_settings, status } = data;

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 font-sans">
      
      {/* STATUS BANNER */}
      {status === 'BILLED' && (
          <div className="max-w-2xl mx-auto mb-6 bg-green-100 border border-green-200 p-6 rounded-2xl flex flex-col items-center text-center shadow-sm">
             <IconCheck />
             <h2 className="text-2xl font-black text-green-800 mt-2">PAID IN FULL</h2>
             <p className="text-green-700 font-medium">Thank you for your business!</p>
          </div>
      )}

      {/* PAPER INVOICE */}
      <div className="max-w-2xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden">
         
         {/* HEADER */}
         <div className="bg-black text-white p-8">
             <div className="flex justify-between items-start">
                 <div>
                     <div className="text-xl font-black italic tracking-tighter mb-2">{shop_settings?.shop_name || "REVLET"}</div>
                     <div className="text-xs text-gray-400 opacity-80 leading-relaxed">
                         {shop_settings?.shop_address}<br />
                         {shop_settings?.shop_phone}
                     </div>
                 </div>
                 <div className="text-right">
                     <h1 className="text-2xl font-black tracking-wide opacity-50">INVOICE</h1>
                     <div className="text-sm font-bold opacity-80 mt-1">#{data.id.slice(0,8).toUpperCase()}</div>
                 </div>
             </div>
         </div>

         {/* DETAILS GRID */}
         <div className="p-8 grid grid-cols-2 gap-8 border-b border-gray-100">
             <div>
                 <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Customer</div>
                 <div className="font-bold text-gray-900">{customer?.name}</div>
                 <div className="text-xs text-gray-500">{customer?.email}</div>
             </div>
             <div className="text-right">
                 <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Vehicle</div>
                 <div className="font-bold text-gray-900">{vehicle?.year} {vehicle?.make} {vehicle?.model}</div>
                 <div className="text-xs text-gray-500 font-mono">{vehicle?.vin}</div>
             </div>
         </div>

         {/* LINE ITEMS */}
         <div className="p-8">
             <table className="w-full text-left text-sm">
                 <thead>
                     <tr className="border-b-2 border-black text-[10px] font-black uppercase tracking-wide">
                         <th className="py-2">Item</th>
                         <th className="py-2 text-right">Cost</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                     {/* Labor */}
                     {financials.labor_hours > 0 && (
                         <tr>
                             <td className="py-4">
                                 <div className="font-bold">Labor Service</div>
                                 <div className="text-xs text-gray-500 mt-0.5">{data.service_title} ({financials.labor_hours} hrs)</div>
                             </td>
                             <td className="py-4 text-right font-medium">${financials.labor_total.toFixed(2)}</td>
                         </tr>
                     )}
                     
                     {/* Parts */}
                     {parts.map((p: any) => (
                         <tr key={p.id}>
                             <td className="py-4">
                                 <div className="font-bold">{p.part_name}</div>
                                 <div className="text-xs text-gray-500 mt-0.5 font-mono">Qty: {p.quantity}</div>
                             </td>
                             <td className="py-4 text-right font-medium">${(p.price * p.quantity).toFixed(2)}</td>
                         </tr>
                     ))}
                 </tbody>
             </table>
         </div>

         {/* TOTALS */}
         <div className="bg-gray-50 p-8">
             <div className="space-y-2">
                 <div className="flex justify-between text-sm text-gray-500">
                     <span>Subtotal</span>
                     <span>${financials.subtotal.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-sm text-gray-500">
                     <span>Tax</span>
                     <span>${financials.tax.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-xl font-black text-gray-900 border-t-2 border-gray-200 pt-4 mt-2">
                     <span>Total</span>
                     <span>${financials.grand_total.toFixed(2)}</span>
                 </div>
             </div>
         </div>

      </div>

      <div className="text-center mt-8 text-xs text-gray-400">
         Powered by Revlet
      </div>
    </div>
  );
}