"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

// --- ICONS ---
const IconSearch = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const IconPlus = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const IconPackage = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;

export default function InventoryDashboardClient({ initialInventory }: { initialInventory: any[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialInventory);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ part_number: "", part_name: "", quantity: "0", cost: "", sell_price: "", vendor: "", bin_location: "" });
  const [adding, setAdding] = useState(false);

  // --- FILTERING ---
  const filteredItems = items.filter(i => 
    i.part_name.toLowerCase().includes(search.toLowerCase()) || 
    i.part_number.toLowerCase().includes(search.toLowerCase())
  );

  // --- ADD ITEM LOGIC ---
  async function handleAddItem() {
    if (!newItem.part_name || !newItem.part_number) return alert("Part Name and Number are required");
    
    setAdding(true);
    const res = await fetch("/api/office/inventory/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem)
    });

    const json = await res.json();
    if (json.ok) {
        setItems([json.item, ...items]);
        setShowAddModal(false);
        setNewItem({ part_number: "", part_name: "", quantity: "0", cost: "", sell_price: "", vendor: "", bin_location: "" });
    } else {
        alert("Failed to add item: " + (json.error || "Unknown Error"));
    }
    setAdding(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      
      {/* === BRANDED HEADER === */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 flex justify-between items-center shadow-sm">
         <div className="flex items-center gap-4">
            {/* Logo / Home Link */}
            <div 
              onClick={() => router.push("/office")}
              className="bg-black text-white px-3 py-1 rounded text-xl font-black tracking-tighter italic cursor-pointer hover:bg-gray-800 transition"
            >
              REVLET
            </div>
            <div className="h-6 w-px bg-gray-200"></div>
            
            {/* Context Title */}
            <div>
                <h1 className="font-bold text-gray-900 leading-none flex items-center gap-2">
                  Inventory Manager
                </h1>
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                  <span onClick={() => router.push("/office")} className="cursor-pointer hover:text-black transition">Office Dashboard</span>
                  <span>/</span>
                  <span>{items.length} Unique SKUs</span>
                </div>
            </div>
         </div>

         <div className="flex gap-3">
             {/* 📦 NEW: MANAGE BUNDLES BUTTON */}
             <button 
                onClick={() => router.push('/office/inventory/packages')}
                className="bg-purple-50 text-purple-700 border border-purple-100 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-purple-100 transition flex items-center gap-2"
             >
                <IconPackage /> Manage Bundles
             </button>

             <button 
                onClick={() => setShowAddModal(true)}
                className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:bg-gray-800 transition flex items-center gap-2"
             >
                <IconPlus /> Add Part
             </button>
         </div>
      </div>

      {/* TOOLBAR */}
      <div className="px-8 py-6 max-w-7xl mx-auto">
         <div className="relative mb-6">
            <div className="absolute left-4 top-3.5 text-gray-400"><IconSearch /></div>
            <input 
                type="text" 
                placeholder="Search by part name or number..." 
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 shadow-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition"
                value={search}
                onChange={e => setSearch(e.target.value)}
            />
         </div>

         {/* TABLE */}
         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs font-black text-gray-500 uppercase tracking-wider">
                        <th className="px-6 py-4">Part Details</th>
                        <th className="px-6 py-4">Stock Level</th>
                        <th className="px-6 py-4 text-right">Cost</th>
                        <th className="px-6 py-4 text-right">Sell Price</th>
                        <th className="px-6 py-4">Location</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition cursor-default">
                            <td className="px-6 py-4">
                                <div className="font-bold text-gray-900">{item.part_name}</div>
                                <div className="text-xs font-mono text-gray-400 mt-0.5">{item.part_number}</div>
                                {item.vendor && <div className="text-[10px] text-blue-600 bg-blue-50 inline-block px-1.5 rounded mt-1">{item.vendor}</div>}
                            </td>
                            <td className="px-6 py-4">
                                <div className={clsx(
                                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-sm",
                                    item.quantity <= 5 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                                )}>
                                    {item.quantity <= 5 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                                    {item.quantity} units
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-sm text-gray-500">
                                ${item.cost?.toFixed(2) || "0.00"}
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-sm font-bold text-gray-900">
                                ${item.sell_price?.toFixed(2) || "0.00"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                                {item.bin_location || "—"}
                            </td>
                        </tr>
                    ))}
                    {filteredItems.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic text-sm">
                                No parts found matching "{search}"
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
         </div>
      </div>

      {/* ADD ITEM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
                <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                    <h2 className="font-bold text-lg">Add New Inventory Item</h2>
                    <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-black">✕</button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Part Number <span className="text-red-500">*</span></label>
                            <input className="w-full p-2 border rounded-lg text-sm font-medium" placeholder="e.g. 1024-AF" value={newItem.part_number} onChange={e => setNewItem({...newItem, part_number: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Part Name <span className="text-red-500">*</span></label>
                            <input className="w-full p-2 border rounded-lg text-sm font-medium" placeholder="e.g. Air Filter" value={newItem.part_name} onChange={e => setNewItem({...newItem, part_name: e.target.value})} />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Qty</label>
                            <input type="number" className="w-full p-2 border rounded-lg text-sm font-medium" placeholder="0" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Cost ($)</label>
                            <input type="number" className="w-full p-2 border rounded-lg text-sm font-medium" placeholder="0.00" value={newItem.cost} onChange={e => setNewItem({...newItem, cost: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Sell ($)</label>
                            <input type="number" className="w-full p-2 border rounded-lg text-sm font-medium" placeholder="0.00" value={newItem.sell_price} onChange={e => setNewItem({...newItem, sell_price: e.target.value})} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Vendor</label>
                            <input className="w-full p-2 border rounded-lg text-sm font-medium" placeholder="e.g. AutoZone" value={newItem.vendor} onChange={e => setNewItem({...newItem, vendor: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Bin / Shelf</label>
                            <input className="w-full p-2 border rounded-lg text-sm font-medium" placeholder="e.g. A-12" value={newItem.bin_location} onChange={e => setNewItem({...newItem, bin_location: e.target.value})} />
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                    <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-black">Cancel</button>
                    <button 
                        onClick={handleAddItem} 
                        disabled={adding}
                        className="px-6 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 disabled:opacity-50"
                    >
                        {adding ? "Saving..." : "Add Item"}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}