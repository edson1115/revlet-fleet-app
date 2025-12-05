"use client";

import { useState } from "react";

export default function PDFEmailButton({ requestId }: { requestId: string }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!email) return alert("Enter an email address.");
    setSending(true);

    try {
      const res = await fetch("/api/pdf/email", {
        method: "POST",
        body: JSON.stringify({ requestId, email }),
      });

      if (!res.ok) throw new Error(await res.text());
      alert("Email sent!");
    } catch (err: any) {
      console.error(err);
      alert("Failed to send PDF.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-2 p-4 border rounded-xl bg-white">
      <input
        type="email"
        placeholder="customer@email.com"
        className="w-full border rounded-lg px-3 py-2"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button
        onClick={handleSend}
        disabled={sending}
        className="w-full bg-black text-white py-2 rounded-lg text-sm"
      >
        {sending ? "Sending..." : "Email PDF"}
      </button>
    </div>
  );
}



