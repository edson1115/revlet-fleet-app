"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import clsx from "clsx";

const IconPlus = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;

export default function TiresClient({ orders, vehicles, customerId }: { orders: any[], vehicles: any[], customerId: string }) {
  const router = useRouter();
  const [isOrdering, setIsOrdering] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [selectedVehicle, setSelectedVehicle] = useState(""); // Default to empty (No Vehicle)
  const [poNumber, setPoNumber] = useState("");
  const [brand, setBrand] = useState("");
  const [tireSize, setTireSize] = useState("");
  const [quantity, setQuantity] = useState("4");
  const [dropShipInfo, setDropShipInfo] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setLoading(true);

      // Pack all the "Solo Order" info into the description
      const description = `TIRE ORDER
PO #: ${poNumber || "N/A"}
Brand: ${brand}
Size: ${tireSize}
Qty: ${quantity}

Drop Ship / Notes:
${dropShipInfo}`;

      const { error } = await supabase.from("service_requests").insert({
          customer_id: customerId,
          vehicle_id: selectedVehicle || null, // Allow null for stock orders
          service_title: `Tire Purchase (${quantity})`, // Make title useful
          status: "NEW",
          description: description
      });

      if (!error) {
          setIsOrdering(false);
          // Reset Form
          setPoNumber("");
          setBrand("");
          setTireSize("");
          setDropShipInfo("");
          router.refresh();
      } else {
          alert("Failed to create order.");
      }
      setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] pb-20">
       
       {/* HEADER */}
       <header className="bg-white/80 backdrop-blur-xl border-b border-zinc-200 sticky top-0 z-40">
           <div className="max-w-7xl mx-auto px-6 h-18 py-4 flex justify-between items-center">
               <div>
                   <h1 className="text-base font-bold text-zinc-900 leading-tight">Tire Center</h1>
                   <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Procurement</span>
               </div>
               <button 
                   onClick={() => setIsOrdering(true)}
                   className="bg-black text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg hover:shadow-black/20 transition active:scale-95 flex items-center gap-2"
               >
                   <IconPlus /> <span>Order Tires</span>
               </button>
           </div>
       </header>

       {/* CONTENT */}
       <main className="max-w-7xl mx-auto px-6 py-8">
           
           {/* ORDER FORM MODAL */}
           {isOrdering && (
               <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                   <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-200 border border-zinc-200">
                       <h2 className="text-xl font-black text-zinc-900 mb-1">New Tire Order</h2>
                       <p className="text-xs text-zinc-500 mb-6">Order for stock or drop-shipment.</p>
                       
                       <form onSubmit={handleSubmit} className="space-y-4">
                           
                           {/* ROW 1: PO & Brand */}
                           <div className="flex gap-4">
                               <div className="flex-1">
                                   <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">PO Number (Optional)</label>
                                   <input 
                                       placeholder="e.g. PO-9921" 
                                       className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold outline-none focus:border-black focus:ring-1 focus:ring-black"
                                       value={poNumber}
                                       onChange={e => setPoNumber(e.target.value)}
                                   />
                               </div>
                               <div className="flex-1">
                                   <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Brand Preference</label>
                                   <input 
                                       required
                                       placeholder="e.g. Michelin / Any" 
                                       className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold outline-none focus:border-black focus:ring-1 focus:ring-black"
                                       value={brand}
                                       onChange={e => setBrand(e.target.value)}
                                   />
                               </div>
                           </div>

                           {/* ROW 2: Size & Qty */}
                           <div className="flex gap-4">
                               <div className="flex-[2]">
                                   <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Size / Spec</label>
                                   <input 
                                       required
                                       placeholder="e.g. 245/70R17" 
                                       className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold outline-none focus:border-black focus:ring-1 focus:ring-black"
                                       value={tireSize}
                                       onChange={e => setTireSize(e.target.value)}
                                   />
                               </div>
                               <div className="flex-1">
                                   <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Qty</label>
                                   <select 
                                       className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold outline-none focus:border-black"
                                       value={quantity}
                                       onChange={e => setQuantity(e.target.value)}
                                   >
                                       {[1,2,4,6,8,10,12,20].map(n => <option key={n} value={n}>{n}</option>)}
                                   </select>
                               </div>
                           </div>

                           {/* VEHICLE (Optional) */}
                           <div>
                               <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Assign to Vehicle (Optional)</label>
                               <select 
                                   className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold outline-none focus:border-black text-zinc-700"
                                   value={selectedVehicle}
                                   onChange={e => setSelectedVehicle(e.target.value)}
                               >
                                   <option value="">No Vehicle (Stock / Drop Ship)</option>
                                   {vehicles.map(v => <option key={v.id} value={v.id}>{v.year} {v.model} ({v.plate})</option>)}
                               </select>
                           </div>

                           {/* DROP SHIP / NOTES */}
                           <div>
                               <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Drop Ship Address / Instructions</label>
                               <textarea 
                                   required
                                   placeholder="Ship to warehouse dock 3... / Call 555-0192 on arrival..." 
                                   className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium outline-none focus:border-black focus:ring-1 focus:ring-black h-24 resize-none"
                                   value={dropShipInfo}
                                   onChange={e => setDropShipInfo(e.target.value)}
                               />
                           </div>

                           <div className="flex gap-3 pt-4">
                               <button type="button" onClick={() => setIsOrdering(false)} className="flex-1 py-3 font-bold text-zinc-500 hover:bg-zinc-100 rounded-xl transition">Cancel</button>
                               <button type="submit" disabled={loading} className="flex-1 py-3 bg-black text-white font-bold rounded-xl shadow-lg shadow-black/20 hover:bg-zinc-800 active:scale-95 transition">
                                   {loading ? "Processing..." : "Submit Order"}
                               </button>
                           </div>
                       </form>
                   </div>
               </div>
           )}

           {/* ORDER LIST */}
           <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
               <table className="w-full text-left text-sm">
                   <thead className="bg-zinc-50 border-b border-zinc-100">
                       <tr>
                           <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Date</th>
                           <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Order Details</th>
                           <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Notes / PO</th>
                           <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-zinc-50">
                       {orders.length === 0 ? (
                           <tr>
                               <td colSpan={4} className="p-10 text-center">
                                   <div className="flex flex-col items-center gap-2">
                                       <span className="text-2xl">📦</span>
                                       <span className="text-zinc-500 font-medium">No tire orders yet.</span>
                                   </div>
                               </td>
                           </tr>
                       ) : orders.map((order: any) => {
                           // Use our smart description or fallback
                           const displayDesc = order.description || "No details";
                           // Check if it's assigned to a vehicle
                           const vehicleText = order.vehicle 
                               ? `${order.vehicle.year} ${order.vehicle.model}` 
                               : "Stock / Drop Ship";

                           return (
                               <tr key={order.id} onClick={() => router.push(`/customer/requests/${order.id}`)} className="hover:bg-zinc-50 cursor-pointer transition group">
                                   <td className="px-6 py-4 font-medium text-zinc-500 tabular-nums">{new Date(order.created_at).toLocaleDateString()}</td>
                                   
                                   {/* Order Details Column */}
                                   <td className="px-6 py-4">
                                       <div className="font-bold text-zinc-900">{order.service_title}</div>
                                       <div className="text-[11px] text-zinc-400 mt-0.5 uppercase tracking-wide font-medium bg-zinc-100 inline-block px-1.5 py-0.5 rounded">
                                           {vehicleText}
                                       </div>
                                   </td>

                                   {/* Notes / PO Column */}
                                   <td className="px-6 py-4">
                                       <div className="text-zinc-600 text-xs whitespace-pre-wrap line-clamp-2 max-w-[250px]">
                                           {displayDesc}
                                       </div>
                                   </td>

                                   <td className="px-6 py-4">
                                       <span className={clsx(
                                           "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                                           order.status === 'COMPLETED' 
                                              ? "bg-green-50 text-green-700 border-green-200" 
                                              : "bg-blue-50 text-blue-700 border-blue-200"
                                       )}>
                                           {order.status}
                                       </span>
                                   </td>
                               </tr>
                           );
                       })}
                   </tbody>
               </table>
           </div>

       </main>
    </div>
  );
}