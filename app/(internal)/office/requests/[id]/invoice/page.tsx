"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// --- ICONS ---
const IconPrint = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>;
const IconCheck = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;

export default function InvoiceBuilderClient({ request }: { request: any }) {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);

  // --- 1. CALCULATE FINANCIALS ---
  const LABOR_RATE = 125.00; // You can make this dynamic later
  const laborHours = request.labor_hours || 0;
  const laborTotal = laborHours * LABOR_RATE;

  const partsTotal = request.request_parts.reduce((sum: number, p: any) => sum + (p.price * p.quantity), 0);
  
  const subtotal = laborTotal + partsTotal;
  const taxRate = 0.0825; // Texas 8.25%
  const tax = subtotal * taxRate;
  const grandTotal = subtotal + tax;

  // --- 2. HANDLE PAY ---
  async function handleFinalize() {
    if(!confirm("Mark this invoice as PAID and close the ticket?")) return;
    
    setProcessing(true);
    
    // We still need an API route to handle the database UPDATE
    const res = await fetch(`/api/office/invoices/${request.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            grand_total: grandTotal,
            method: "MANUAL"
        })
    });
    
    if(res.ok) {
        alert("Invoice Paid & Closed!");
        router.push("/office/analytics"); 
    } else {
        alert("Error closing invoice");
    }
    setProcessing(false);
  }

  const { customer, vehicle, request_parts: parts } = request;

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      
      {/* TOOLBAR (Hidden when printing) */}
      <div className="max-w-3xl mx-auto mb-6 flex justify-between items-center no-print print:hidden">
         <button onClick={() => router.back()} className="text-sm font-bold text-gray-500 hover:text-black">← Back to Request</button>
         <div className="flex gap-3">
             <button onClick={() => window.print()} className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-50">
                <IconPrint /> Print PDF
             </button>
             {request.status !== "BILLED" && (
                 <button 
                    onClick={handleFinalize}
                    disabled={processing}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg hover:bg-green-700 flex items-center gap-2"
                 >
                    {processing ? "Processing..." : <><IconCheck /> Mark Paid ${grandTotal.toFixed(2)}</>}
                 </button>
             )}
         </div>
      </div>

      {/* INVOICE PAPER */}
      <div className="max-w-3xl mx-auto bg-white shadow-2xl rounded-xl overflow-hidden print:shadow-none print:w-full print:max-w-none">
         
         {/* HEADER */}
         <div className="bg-black text-white p-8 flex justify-between items-start print:bg-white print:text-black print:border-b-2 print:border-black">
             <div>
                 <div className="text-2xl font-black italic tracking-tighter mb-2">REVLET</div>
                 <div className="text-sm text-gray-400 print:text-gray-600">
                     Automotive Specialists<br />
                     123 Garage Lane, Austin TX<br />
                     (512) 555-0199
                 </div>
             </div>
             <div className="text-right">
                 <h1 className="text-4xl font-black tracking-wide text-gray-800 opacity-50 mb-1">INVOICE</h1>
                 <div className="text-lg font-bold">#{request.id.slice(0,8).toUpperCase()}</div>
                 <div className="text-sm text-gray-400 print:text-gray-600">{new Date().toLocaleDateString()}</div>
             </div>
         </div>

         {/* BILL TO */}
         <div className="p-8 grid grid-cols-2 gap-8">
             <div>
                 <div className="text-xs font-bold text-gray-400 uppercase mb-1">Bill To</div>
                 <div className="font-bold text-xl">{customer?.name || "Cash Customer"}</div>
                 <div className="text-sm text-gray-500">{customer?.email}</div>
                 <div className="text-sm text-gray-500">{customer?.phone}</div>
             </div>
             <div className="text-right">
                 <div className="text-xs font-bold text-gray-400 uppercase mb-1">Vehicle</div>
                 <div className="font-bold text-xl">{vehicle?.year} {vehicle?.make} {vehicle?.model}</div>
                 <div className="text-sm text-gray-500 font-mono">VIN: {vehicle?.vin}</div>
                 <div className="text-sm text-gray-500">Plate: {request.plate || vehicle?.plate}</div>
             </div>
         </div>

         {/* LINE ITEMS */}
         <div className="px-8 py-4">
             <table className="w-full text-left">
                 <thead>
                     <tr className="border-b-2 border-black text-xs font-black uppercase tracking-wide">
                         <th className="py-2">Description</th>
                         <th className="py-2 text-center">Qty</th>
                         <th className="py-2 text-right">Unit Price</th>
                         <th className="py-2 text-right">Total</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100 text-sm">
                     {/* LABOR */}
                     {laborHours > 0 && (
                         <tr>
                             <td className="py-4 font-bold">
                                 Labor - {request.service_title}
                                 <div className="text-xs font-normal text-gray-500 mt-1">{request.service_description}</div>
                             </td>
                             <td className="py-4 text-center">{laborHours} hrs</td>
                             <td className="py-4 text-right">${LABOR_RATE.toFixed(2)}</td>
                             <td className="py-4 text-right font-bold">${laborTotal.toFixed(2)}</td>
                         </tr>
                     )}

                     {/* PARTS */}
                     {parts.map((part: any) => (
                         <tr key={part.id}>
                             <td className="py-4">
                                 <span className="font-bold">{part.part_name}</span>
                                 <span className="text-gray-400 text-xs ml-2">({part.part_number})</span>
                             </td>
                             <td className="py-4 text-center">{part.quantity}</td>
                             <td className="py-4 text-right">${part.price?.toFixed(2) || "0.00"}</td>
                             <td className="py-4 text-right font-bold">${((part.price || 0) * part.quantity).toFixed(2)}</td>
                         </tr>
                     ))}
                 </tbody>
             </table>
         </div>

         {/* TOTALS */}
         <div className="p-8 bg-gray-50 border-t border-gray-100 print:bg-white">
             <div className="flex justify-end">
                 <div className="w-64 space-y-2">
                     <div className="flex justify-between text-gray-600">
                         <span>Subtotal</span>
                         <span>${subtotal.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between text-gray-600">
                         <span>Tax (8.25%)</span>
                         <span>${tax.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between text-2xl font-black text-black border-t-2 border-black pt-2 mt-2">
                         <span>Total</span>
                         <span>${grandTotal.toFixed(2)}</span>
                     </div>
                 </div>
             </div>
             
             {/* THANK YOU */}
             <div className="mt-8 text-center text-xs text-gray-400 uppercase tracking-widest print:mt-12">
                 Thank you for your business
             </div>
         </div>

      </div>
    </div>
  );
}