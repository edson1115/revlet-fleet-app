// app/portal/support/page.tsx
"use client";

import { useState } from "react";

export default function PortalSupportPage() {
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setErr("");
    if (!text.trim()) return;
    try {
      const res = await fetch("/api/portal/support", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("fail");
      setSent(true);
      setText("");
    } catch {
      setErr("Failed to send support message.");
    }
  }

  return (
    <div className="p-6 mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Support</h1>

      <p className="text-gray-600 text-sm">
        Have a question or need help? Send us a message and our team will
        respond quickly.
      </p>

      {sent && (
        <div className="p-3 border rounded bg-green-50 text-green-700 text-sm">
          Your message was sent!
        </div>
      )}

      {err && (
        <div className="p-3 border rounded bg-red-50 text-red-700 text-sm">
          {err}
        </div>
      )}

      <textarea
        className="w-full border rounded-lg p-3 min-h-[120px]"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Describe your issue…"
      />

      <button
        onClick={submit}
        className="px-4 py-2 bg-black text-white rounded hover:bg-gray-900"
      >
        Send Message
      </button>
    </div>
  );
}
