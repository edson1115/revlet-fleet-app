"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// --- ICONS ---
const IconSave = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>;
const IconGear = () => <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Initialize state
  const [settings, setSettings] = useState<any>({ 
      labor_rate: 125, 
      tax_rate: 0.0825,
      enable_email_notifications: false 
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    // Fetch from API instead of direct DB
    const res = await fetch("/api/office/settings");
    const data = await res.json();
    if (data) setSettings(data);
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    
    // Post to API (Server-side write)
    const res = await fetch("/api/office/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
    });

    if (!res.ok) {
        alert("Error saving settings");
    } else {
        alert("Settings Updated!");
    }
    
    setSaving(false);
  }

  if (loading) return <div className="p-10">Loading settings...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
         <div className="flex items-center gap-4">
             <div onClick={() => router.push("/office")} className="bg-black text-white px-3 py-1 rounded text-xl font-black italic cursor-pointer hover:bg-gray-800 transition">REVLET</div>
             <div className="h-6 w-px bg-gray-200"></div>
             <h1 className="font-bold text-gray-900 flex items-center gap-2">
                <IconGear /> Shop Settings
             </h1>
         </div>
         <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-black text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg hover:bg-gray-800 transition flex items-center gap-2"
         >
            {saving ? "Saving..." : <><IconSave /> Save Changes</>}
         </button>
      </div>

      <div className="max-w-2xl mx-auto p-8 space-y-6">
          
          {/* EMAIL ALERTS */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
              <div>
                  <h3 className="text-sm font-bold uppercase text-gray-900 tracking-wide flex items-center gap-2">
                      <span className="text-xl">📧</span> Customer Email Alerts
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                      Automatically email customers when jobs start or finish.
                  </p>
              </div>
              
              <button 
                  onClick={() => setSettings({...settings, enable_email_notifications: !settings.enable_email_notifications})}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      settings.enable_email_notifications ? 'bg-green-500' : 'bg-gray-200'
                  }`}
              >
                  <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      settings.enable_email_notifications ? 'translate-x-7' : 'translate-x-1'
                  }`}/>
              </button>
          </div>

          {/* FINANCIALS */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 tracking-wide">Financial Defaults</h3>
              <div className="grid grid-cols-2 gap-6">
                  <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Labor Rate ($/hr)</label>
                      <input 
                        type="number" 
                        className="w-full p-2 border rounded-lg font-mono font-bold"
                        value={settings.labor_rate}
                        onChange={e => setSettings({...settings, labor_rate: e.target.value})}
                      />
                      <p className="text-[10px] text-gray-400 mt-1">Standard hourly billing rate.</p>
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Tax Rate (Decimal)</label>
                      <input 
                        type="number" 
                        step="0.0001"
                        className="w-full p-2 border rounded-lg font-mono font-bold"
                        value={settings.tax_rate}
                        onChange={e => setSettings({...settings, tax_rate: e.target.value})}
                      />
                      <p className="text-[10px] text-gray-400 mt-1">Ex: 0.0825 for 8.25%</p>
                  </div>
              </div>
          </div>

          {/* BRANDING */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 tracking-wide">Invoice Branding</h3>
              <div className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Shop Name</label>
                      <input 
                        className="w-full p-2 border rounded-lg"
                        value={settings.shop_name}
                        onChange={e => setSettings({...settings, shop_name: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Address</label>
                      <input 
                        className="w-full p-2 border rounded-lg"
                        value={settings.shop_address}
                        onChange={e => setSettings({...settings, shop_address: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Phone</label>
                      <input 
                        className="w-full p-2 border rounded-lg"
                        value={settings.shop_phone}
                        onChange={e => setSettings({...settings, shop_phone: e.target.value})}
                      />
                  </div>
              </div>
          </div>

      </div>
    </div>
  );
}