"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export default function AdminAISettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  
  // Unified Settings State 🧠
  const [settings, setSettings] = useState({
      // Financials
      labor_rate: 125.00,
      tax_rate: 0.0825,
      // Identity
      company_name: "",
      company_address: "",
      company_phone: "",
      // AI / Intelligence
      openai_api_key: "",
      ai_model: "gpt-4o-mini",
      ai_temperature: 0.2,
      ai_sales_threshold: 50
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchSettings = async () => {
        const { data } = await supabase.from("shop_settings").select("*").single();
        if (data) {
            // Merge DB data with defaults to prevent null crashes
            setSettings(prev => ({ ...prev, ...data }));
        }
        setLoading(false);
    };
    fetchSettings();
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage("");

    const { error } = await supabase
        .from("shop_settings")
        .upsert({
            id: 1, // Ensure we update the main config row
            ...settings,
            updated_at: new Date().toISOString()
        });

    if (error) {
        setMessage(`Error: ${error.message}`);
    } else {
        setMessage("✅ System Configuration Saved");
        setTimeout(() => setMessage(""), 3000);
    }
    setSaving(false);
  }

  if (loading) return (
      <div className="min-h-screen bg-[#F4F5F7] p-20 text-center font-black uppercase italic tracking-widest text-zinc-400 animate-pulse">
          Loading System Core...
      </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-zinc-900 font-sans p-8 pb-32">
      
      {/* HEADER */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2 uppercase italic">System Command</h1>
          <p className="text-zinc-500">Configure Financials, Identity, and AI Intelligence.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
            <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-black text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 shadow-lg shadow-black/20 transition-all active:scale-95 disabled:opacity-50"
            >
                {saving ? "Syncing..." : "Save All Changes"}
            </button>
            {message && <div className="text-[10px] font-black text-emerald-600 uppercase tracking-wide animate-fade-in">{message}</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* --- 1. AI INTELLIGENCE (The Brain) --- */}
          <div className="bg-white p-8 rounded-[2rem] border border-zinc-200 shadow-sm lg:col-span-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none"></div>
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg">🤖</div>
                  <div>
                      <h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest">AI Intelligence</h2>
                      <p className="text-xs text-zinc-400">Controls the automated dispatch and lead scoring logic.</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                  <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">OpenAI API Key</label>
                      <input 
                        type="password" 
                        placeholder="sk-..."
                        value={settings.openai_api_key || ""}
                        onChange={(e) => setSettings({...settings, openai_api_key: e.target.value})}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">AI Model</label>
                      <select 
                        value={settings.ai_model || "gpt-4o-mini"}
                        onChange={(e) => setSettings({...settings, ai_model: e.target.value})}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                      >
                          <option value="gpt-4o">GPT-4o (Smartest)</option>
                          <option value="gpt-4o-mini">GPT-4o Mini (Fastest)</option>
                          <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Legacy)</option>
                      </select>
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Creativity (Temp: {settings.ai_temperature})</label>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.1"
                        value={settings.ai_temperature}
                        onChange={(e) => setSettings({...settings, ai_temperature: parseFloat(e.target.value)})}
                        className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                      />
                  </div>
                  <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Sales "Hot Lead" Threshold ({settings.ai_sales_threshold})</label>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        step="5"
                        value={settings.ai_sales_threshold}
                        onChange={(e) => setSettings({...settings, ai_sales_threshold: parseInt(e.target.value)})}
                        className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                      />
                      <div className="flex justify-between mt-1 text-[9px] text-zinc-400 font-bold uppercase">
                          <span>More Leads</span>
                          <span>Higher Quality</span>
                      </div>
                  </div>
              </div>
          </div>

          {/* --- 2. FINANCIAL CORE --- */}
          <div className="bg-white p-8 rounded-[2rem] border border-zinc-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg">$</div>
                  <h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Financial Logic</h2>
              </div>
              
              <div className="space-y-6">
                  <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Global Labor Rate ($/hr)</label>
                      <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                          <input 
                            type="number" 
                            value={settings.labor_rate}
                            onChange={(e) => setSettings({...settings, labor_rate: parseFloat(e.target.value)})}
                            className="w-full pl-8 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                      </div>
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Tax Rate (Decimal)</label>
                      <input 
                        type="number" 
                        step="0.0001"
                        value={settings.tax_rate}
                        onChange={(e) => setSettings({...settings, tax_rate: parseFloat(e.target.value)})}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <p className="text-[10px] text-zinc-400 mt-2">Example: 0.0825 = 8.25%</p>
                  </div>
              </div>
          </div>

          {/* --- 3. IDENTITY --- */}
          <div className="bg-white p-8 rounded-[2rem] border border-zinc-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">🏢</div>
                  <h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Company Identity</h2>
              </div>

              <div className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Company Name</label>
                      <input 
                        type="text" 
                        value={settings.company_name}
                        onChange={(e) => setSettings({...settings, company_name: e.target.value})}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Address</label>
                      <textarea 
                        value={settings.company_address}
                        onChange={(e) => setSettings({...settings, company_address: e.target.value})}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                      />
                  </div>
              </div>
          </div>

      </div>
    </div>
  );
}