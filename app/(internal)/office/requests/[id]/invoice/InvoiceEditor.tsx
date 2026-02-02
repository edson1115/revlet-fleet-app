"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InvoiceEditor({ request, existingInvoice }: { request: any, existingInvoice: any }) {
  const router = useRouter();
  
  // State
  const [laborCost, setLaborCost] = useState<number>(existingInvoice?.labor_cost || 150.00);
  const [loading, setLoading] = useState(false);

  // Calculations
  const partsTotal = request.request_parts?.reduce((acc: number, p: any) => acc + ((p.price || 0) * p.quantity), 0) || 0;
  const subtotal = partsTotal + laborCost;
  const taxRate = 0.0825; // 8.25% Tax
  const taxAmount = subtotal * taxRate;
  const grandTotal = subtotal + taxAmount;

  const isFinalized = request.status === "BILLED" || existingInvoice?.status === "SENT";

  async function handleFinalize() {
    if (!confirm(`Finalize Invoice for $${grandTotal.toFixed(2)}? This will mark the ticket as BILLED.`)) return;
    
    setLoading(true);

    const invoiceNum = existingInvoice?.invoice_number || `INV-${Math.floor(1000 + Math.random() * 9000)}`;

    const res = await fetch("/api/office/invoice/finalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId: request.id,
        customerId: request.customer_id,
        laborCost,
        partsCost: partsTotal,
        taxAmount,
        totalAmount: grandTotal,
        invoiceNumber: invoiceNum
      })
    });

    if (res.ok) {
        alert("✅ Invoice Finalized!");
        router.refresh();
        router.push("/office"); 
    } else {
        alert("❌ Error saving invoice.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-zinc-100 p-8 font-sans text-zinc-900 flex justify-center">
      
      <div className="w-full max-w-[800px] bg-white shadow-xl min-h-[1000px] flex flex-col relative print:shadow-none print:w-full">
        
        {/* TOP BAR */}
        <div className="bg-zinc-900 text-white p-4 flex justify-between items-center print:hidden">
            <button onClick={() => router.back()} className="text-sm text-zinc-400 hover:text-white">← Back</button>
            <div className="flex gap-3">
                <button onClick={() => window.print()} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-xs font-bold">
                    🖨️ Print PDF
                </button>
                {!isFinalized && (
                    <button 
                        onClick={handleFinalize} 
                        disabled={loading}
                        className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded text-xs font-bold disabled:opacity-50"
                    >
                        {loading ? "Saving..." : "💾 Finalize & Bill"}
                    </button>
                )}
            </div>
        </div>

        {/* INVOICE SHEET */}
        <div className="p-12 flex-1">
            
            <div className="flex justify-between border-b-4 border-black pb-6 mb-8">
                <div>
                    <h1 className="text-4xl font-black italic tracking-tighter">REVLET</h1>
                    <p className="text-xs font-bold uppercase tracking-widest mt-1 text-zinc-500">Fleet Services</p>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-black text-zinc-200 uppercase">Invoice</h2>
                    <p className="font-bold text-zinc-900 text-lg">#{existingInvoice?.invoice_number || "DRAFT"}</p>
                    <p className="text-sm text-zinc-500">{new Date().toLocaleDateString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-12">
                <div>
                    <h3 className="text-xs font-black uppercase text-zinc-400 mb-2">Bill To</h3>
                    {/* ✅ FIXED: Access 'customer.name' directly */}
                    <div className="font-bold text-lg">{request.customer?.name || "Customer"}</div>
                    <div className="text-sm text-zinc-600">{request.customer?.email}</div>
                    <div className="text-sm text-zinc-600">{request.customer?.phone}</div>
                </div>
                <div className="text-right">
                    <h3 className="text-xs font-black uppercase text-zinc-400 mb-2">Vehicle</h3>
                    <div className="font-bold">{request.vehicle?.year} {request.vehicle?.make} {request.vehicle?.model}</div>
                    <div className="text-sm text-zinc-600">VIN: {request.vehicle?.vin}</div>
                    <div className="mt-2 inline-block bg-zinc-100 px-2 py-1 rounded text-xs font-mono">
                         {request.service_title || "Service Request"}
                    </div>
                </div>
            </div>

            <table className="w-full mb-8">
                <thead>
                    <tr className="border-b-2 border-black text-xs font-black uppercase tracking-wide text-left">
                        <th className="py-2">Description</th>
                        <th className="py-2 text-center">Qty</th>
                        <th className="py-2 text-right">Price</th>
                        <th className="py-2 text-right">Total</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {/* LABOR */}
                    <tr className="border-b border-zinc-100">
                        <td className="py-4 font-bold">
                            Labor / Service Fee
                            <div className="text-xs font-normal text-zinc-500">{request.service_description}</div>
                        </td>
                        <td className="py-4 text-center">1</td>
                        <td className="py-4 text-right">
                            {isFinalized ? (
                                <span>${laborCost.toFixed(2)}</span>
                            ) : (
                                <input 
                                    type="number" 
                                    value={laborCost}
                                    onChange={(e) => setLaborCost(parseFloat(e.target.value) || 0)}
                                    className="w-20 text-right p-1 border rounded bg-yellow-50 font-mono"
                                />
                            )}
                        </td>
                        <td className="py-4 text-right font-mono">${laborCost.toFixed(2)}</td>
                    </tr>

                    {/* PARTS */}
                    {request.request_parts?.map((part: any) => (
                        <tr key={part.id} className="border-b border-zinc-100">
                            <td className="py-4">{part.part_name}</td>
                            <td className="py-4 text-center">{part.quantity}</td>
                            <td className="py-4 text-right">${(part.price || 0).toFixed(2)}</td>
                            <td className="py-4 text-right font-mono">${((part.price || 0) * part.quantity).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-end">
                <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm text-zinc-600">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-zinc-600">
                        <span>Tax (8.25%)</span>
                        <span>${taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-2xl font-black text-black border-t-2 border-black pt-4 mt-2">
                        <span>Total</span>
                        <span>${grandTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {isFinalized && (
                <div className="absolute bottom-20 left-12 border-4 border-red-600 text-red-600 text-4xl font-black uppercase p-4 transform -rotate-12 opacity-50 pointer-events-none">
                    BILLED
                </div>
            )}
        </div>
      </div>
    </div>
  );
}