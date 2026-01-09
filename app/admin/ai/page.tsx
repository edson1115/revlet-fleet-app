"use client";

import { useEffect, useState } from "react";
import { saveAISettings } from "@/app/actions/admin";
import TeslaLayoutShell from "@/components/tesla/layout/TeslaLayoutShell";
import { TeslaHeroBar } from "@/components/tesla/TeslaHeroBar";

export default function AdminAISettingsPage() {
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-4.1-mini");
  const [temp, setTemp] = useState("0.2");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/ai/settings");
        if (res.ok) {
          const js = await res.json();
          setApiKey(js.openai_api_key || "");
          setModel(js.ai_model || "gpt-4.1-mini");
          setTemp(js.ai_temperature || "0.2");
        }
      } catch (err) {
        console.error("Failed to load AI settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  async function handleSave() {
    setIsSaving(true);
    setMessage("");

    const config = {
      openai_api_key: apiKey,
      ai_model: model,
      ai_temperature: temp
    };

    const result = await saveAISettings(config);

    if (result.success) {
      setMessage("Settings Saved Successfully ✅");
      setTimeout(() => setMessage(""), 3000);
    } else {
      setMessage(`Error: ${result.error || "Save failed"}`);
    }
    setIsSaving(false);
  }

  if (loading) {
    return (
      <TeslaLayoutShell>
        <div className="p-20 text-center font-black uppercase italic tracking-widest text-zinc-400 animate-pulse">
          Loading AI Protocols...
        </div>
      </TeslaLayoutShell>
    );
  }

  return (
    <TeslaLayoutShell>
      <TeslaHeroBar 
        title="AI Intelligence Settings" 
        subtitle="Configure the Large Language Model parameters for automated dispatch" 
      />

      <div className="max-w-2xl mx-auto p-8 space-y-8">
        <div className="bg-white rounded-[2rem] border border-zinc-100 p-8 shadow-sm space-y-6">
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
              OpenAI API Key
            </label>
            <input
              className="w-full bg-zinc-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-black transition-all"
              type="password"
              placeholder="sk-••••••••••••••••••••••••"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
              AI Model
            </label>
            <input
              className="w-full bg-zinc-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-black transition-all"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
              Temperature (0.0 - 1.0)
            </label>
            <input
              className="w-full bg-zinc-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-black transition-all"
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
            />
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-10 py-4 bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-zinc-800 disabled:opacity-50 transition-all shadow-xl active:scale-95"
            >
              {isSaving ? "Syncing..." : "Update AI Config"}
            </button>
            
            {message && (
              <p className="text-[10px] font-black uppercase text-emerald-600 tracking-tighter">
                {message}
              </p>
            )}
          </div>
        </div>

        <div className="bg-zinc-50 p-6 rounded-[2rem] border border-dashed border-zinc-200">
            <p className="text-[10px] text-zinc-400 font-medium leading-relaxed uppercase tracking-tight">
                Warning: These settings control the autonomous dispatch logic. Modifying the API Key or Model may impact real-time fleet intelligence.
            </p>
        </div>
      </div>
    </TeslaLayoutShell>
  );
}