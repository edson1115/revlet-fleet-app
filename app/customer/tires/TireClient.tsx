"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

// --- LOGOS ---
const LogoMichelin = () => <img src="/images/michelin-logo.png" alt="Michelin" className="w-32 h-auto object-contain" />;
const LogoBridgestone = () => <img src="/images/bridgestone-logo.png" alt="Bridgestone" className="w-32 h-auto object-contain" />;
const LogoGoodyear = () => <img src="/images/goodyear-logo.png" alt="Goodyear" className="w-32 h-auto object-contain" />;
const LogoGeneric = () => <div className="flex items-center justify-center"><span className="font-black text-2xl tracking-tighter uppercase text-gray-700">OTHER</span></div>;

const IconShip = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>;
const IconWrench = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;

const BRANDS = [
    { id: "Michelin", color: "bg-white hover:bg-gray-50", component: <LogoMichelin /> },
    { id: "Bridgestone", color: "bg-white hover:bg-gray-50", component: <LogoBridgestone /> },
    { id: "Goodyear", color: "bg-white hover:bg-gray-50", component: <LogoGoodyear /> },
    { id: "Other", color: "bg-white hover:bg-gray-50", component: <LogoGeneric /> },
];

export default function TireClient() {
  const router = useRouter();

  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [serviceMode, setServiceMode] = useState<"DROP_SHIP" | "MOBILE_INSTALL">("DROP_SHIP");
  const [tireSize, setTireSize] = useState("");
  const [qty, setQty] = useState(4);
  const [reqDate, setReqDate] = useState("");
  const [po, setPo] = useState("");
  const [dock, setDock] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function submitOrder() {
    if (!selectedBrand || !tireSize || qty <= 0) return alert("Please fill in Brand, Size, and Quantity.");
    
    setSaving(true);

    try {
        // SIMPLE FETCH - No Headers, No Manual Auth
        // The browser automatically includes the cookies
        const res = await fetch("/api/customer/tires/order", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                brand: selectedBrand,
                size: tireSize,
                qty,
                mode: serviceMode,
                date: reqDate,
                dock,
                po,
                notes
            })
        });

        const data = await res.json();
        setSaving(false);

        if (!res.ok) {
            throw new Error(data.error || "Submission failed");
        }

        router.push("/customer");
        router.refresh();

    } catch (err: any) {
        alert("Error: " + err.message);
        setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8">
        <div className="max-w-5xl mx-auto mb-10">
             <button onClick={() => router.back()} className="text-gray-400 text-xs font-bold uppercase tracking-widest hover:text-black mb-2">&larr; Back</button>
            <h1 className="text-4xl font-black text-gray-900">Tire Procurement</h1>
            <p className="text-gray-500 mt-2 text-lg">Select a brand to begin.</p>
        </div>

        {!selectedBrand ? (
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-5">
                {BRANDS.map((b) => (
                    <div key={b.id} onClick={() => setSelectedBrand(b.id)} className={clsx("h-40 rounded-2xl flex items-center justify-center cursor-pointer shadow-sm hover:shadow-xl transition transform hover:-translate-y-1 border-2 border-transparent hover:border-black p-8", b.color)}>
                        {b.component}
                    </div>
                ))}
            </div>
        ) : (
            <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
                <div className="bg-black text-white px-8 py-6 flex justify-between items-center">
                    <h2 className="text-2xl font-black">{selectedBrand} TIRES</h2>
                    <button onClick={() => setSelectedBrand(null)} className="text-gray-500 hover:text-white font-bold text-sm">Change</button>
                </div>
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4 bg-gray-100 p-1 rounded-xl">
                         <button onClick={() => setServiceMode("DROP_SHIP")} className={clsx("py-3 rounded-lg text-sm font-bold", serviceMode === "DROP_SHIP" ? "bg-white shadow" : "text-gray-500")}><IconShip /> Drop-Ship</button>
                         <button onClick={() => setServiceMode("MOBILE_INSTALL")} className={clsx("py-3 rounded-lg text-sm font-bold", serviceMode === "MOBILE_INSTALL" ? "bg-white shadow" : "text-gray-500")}><IconWrench /> Mobile Install</button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input placeholder="Tire Size (e.g. 245/70R17)" className="p-4 bg-gray-50 rounded-xl font-bold" value={tireSize} onChange={e => setTireSize(e.target.value)} />
                        <input type="number" className="p-4 bg-gray-50 rounded-xl font-bold" value={qty} onChange={e => setQty(parseInt(e.target.value))} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <input type="date" className="p-4 bg-gray-50 rounded-xl font-bold" value={reqDate} onChange={e => setReqDate(e.target.value)} />
                         <input placeholder="PO Number" className="p-4 bg-gray-50 rounded-xl font-bold" value={po} onChange={e => setPo(e.target.value)} />
                    </div>
                    <input placeholder="Delivery Dock / Location" className="w-full p-4 bg-gray-50 rounded-xl font-bold" value={dock} onChange={e => setDock(e.target.value)} />
                    <textarea placeholder="Notes..." className="w-full p-4 bg-gray-50 rounded-xl font-medium" rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
                    <button onClick={submitOrder} disabled={saving} className="w-full py-5 bg-black text-white font-black text-lg rounded-2xl hover:bg-gray-800 disabled:opacity-50">
                        {saving ? "Processing..." : "Submit Order"}
                    </button>
                </div>
            </div>
        )}
    </div>
  );
}