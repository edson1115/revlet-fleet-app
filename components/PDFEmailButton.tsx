"use client";

import { useState } from "react";

export default function PDFEmailButton({ requestId }: { requestId: string }) {
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");

  async function send() {
    const res = await fetch(`/api/pdf/email`, {
      method: "POST",
      body: JSON.stringify({ requestId, to: [to], message }),
    });

    if (res.ok) {
      alert("Email sent!");
      setOpen(false);
    } else {
      alert("Failed to send");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm"
      >
        Email PDF
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 space-y-4 w-full max-w-sm">
            <h3 className="text-lg font-semibold">Email PDF</h3>
            <input
              placeholder="Recipient Email"
              className="w-full border p-2 rounded"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            <textarea
              placeholder="Message"
              className="w-full border p-2 rounded"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button
              onClick={send}
              className="w-full bg-green-600 text-white py-2 rounded-lg"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
