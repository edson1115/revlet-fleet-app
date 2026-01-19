"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

// Simple Spinner Icon
const IconSpinner = () => <svg className="animate-spin w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

type Props = {
  open: boolean;
  onClose: () => void;
  vehicle: any;
};

export default function VehicleAIBrain({ open, onClose, vehicle }: Props) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState("");

  async function runAI() {
    if (!vehicle) return;

    setLoading(true);
    setAnalysis(null);
    setError("");

    try {
      const res = await fetch("/api/ai/vehicle-brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Important: Sends your session cookie
        body: JSON.stringify({ vehicle }),
      });

      const js = await res.json();
      
      if (!res.ok) {
        throw new Error(js.error || "AI Service Unavailable");
      }

      setAnalysis(js.analysis);
    } catch (err: any) {
      console.error("AI Brain error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Run AI automatically when panel opens
  useEffect(() => {
    if (open && vehicle) runAI();
  }, [open, vehicle]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end">
      {/* BACKDROP */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* DRAWER */}
      <div className="relative w-full max-w-lg h-full bg-white shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* HEADER */}
        <div className="p-8 border-b border-zinc-100 bg-zinc-50 sticky top-0 z-10">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight uppercase italic leading-none">
                Revlet AI Brain
            </h2>
            <button 
                onClick={onClose}
                className="rounded-full bg-white p-2 hover:bg-zinc-200 transition"
            >
                ✕
            </button>
          </div>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
            Analyzing {vehicle?.year} {vehicle?.model}...
          </p>
        </div>

        {/* CONTENT */}
        <div className="p-8 space-y-8 flex-1">
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
               <IconSpinner />
               <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest animate-pulse">Running Diagnostics...</p>
            </div>
          )}

          {error && (
            <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-center">
                <p className="text-red-600 font-bold mb-2">Analysis Failed</p>
                <p className="text-xs text-red-400 font-mono">{error}</p>
                <button 
                    onClick={runAI}
                    className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-200"
                >
                    Try Again
                </button>
            </div>
          )}

          {!loading && analysis && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* SUMMARY */}
              <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-2xl">
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">AI Summary</div>
                <p className="text-sm font-medium text-zinc-700 leading-relaxed">
                  {analysis.summary}
                </p>
              </div>

              {/* DIAGNOSIS */}
              <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl">
                 <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Diagnosis</div>
                 <p className="text-sm font-bold text-blue-900 leading-relaxed">
                   {analysis.diagnosis}
                 </p>
              </div>

              {/* RECOMMENDATIONS */}
              <div>
                 <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Recommended Actions</div>
                 <ul className="space-y-3">
                    {analysis.recommendations?.map((r: string, i: number) => (
                        <li key={i} className="flex gap-3 text-sm text-zinc-700 font-medium p-4 border rounded-xl bg-white">
                            <span className="text-blue-500 font-black">•</span>
                            {r}
                        </li>
                    ))}
                 </ul>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}