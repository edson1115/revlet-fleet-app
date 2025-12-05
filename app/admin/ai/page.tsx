// app/admin/ai/page.tsx
"use client";

import { useEffect, useState } from "react";

export default function AdminAISettingsPage() {
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-4.1-mini");
  const [temp, setTemp] = useState("0.2");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/ai/settings", {
          credentials: "include",
        });
        const js = await res.json();

        if (live) {
          setApiKey(js.openai_api_key || "");
          setModel(js.ai_model || "gpt-4.1-mini");
          setTemp(js.ai_temperature || "0.2");
        }
      } catch {}
      finally { live && setLoading(false); }
    })();

    return () => { live = false };
  }, []);

  async function save() {
    const res = await fetch("/api/admin/ai/settings", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        openai_api_key: apiKey,
        ai_model: model,
        ai_temperature: temp
      })
    });

    if (res.ok) {
      setMessage("Saved!");
      setTimeout(() => setMessage(""), 1500);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6 max-w-xl">
      <h1 className="text-2xl font-semibold">AI Settings</h1>

      <div className="space-y-3">
        <label className="text-sm">OpenAI API Key</label>
        <input
          className="border rounded-lg w-full p-2"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm">Model</label>
        <input
          className="border rounded-lg w-full p-2"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm">Temperature (0–1)</label>
        <input
          className="border rounded-lg w-full p-2"
          value={temp}
          onChange={(e) => setTemp(e.target.value)}
        />
      </div>

      <button
        onClick={save}
        className="px-4 py-2 bg-black text-white rounded-lg"
      >
        Save
      </button>

      {message && <div className="text-green-600 text-sm">{message}</div>}
    </div>
  );
}



