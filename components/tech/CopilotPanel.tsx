"use client";

import { useState } from "react";

type CopilotMsg = {
  role: "user" | "assistant";
  content: string;
};

type CopilotProps = {
  requestId: string;
};

export default function CopilotPanel({ requestId }: CopilotProps) {
  const [messages, setMessages] = useState<CopilotMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function send(kind: string) {
    setLoading(true);

    const payload = {
      id: requestId,
      kind, // "explain", "fix", "parts", "summary", "custom"
      message: input || null,
    };

    try {
      const res = await fetch("/api/tech/copilot", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const js = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "user", content: input || commandToText(kind) },
        { role: "assistant", content: js.answer },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Error contacting Copilot.",
        },
      ]);
    }

    setInput("");
    setLoading(false);
  }

  function commandToText(kind: string) {
    switch (kind) {
      case "explain":
        return "Explain this issue";
      case "fix":
        return "Suggest the fix";
      case "parts":
        return "Predict the parts needed";
      case "summary":
        return "Write a completion summary";
      default:
        return "Ask Copilot";
    }
  }

  return (
    <div className="border rounded-2xl p-4 bg-white mt-6 shadow-sm">
      {/* HEADER */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <h2 className="text-lg font-semibold">🔧 Tech Copilot</h2>
        <button className="text-sm px-3 py-1 rounded border">
          {open ? "Hide" : "Show"}
        </button>
      </div>

      {!open ? null : (
        <div className="mt-4 space-y-4">
          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => send("explain")}
              className="px-3 py-1.5 rounded bg-black text-white text-xs"
              disabled={loading}
            >
              Explain Issue
            </button>

            <button
              onClick={() => send("fix")}
              className="px-3 py-1.5 rounded border text-xs"
              disabled={loading}
            >
              Suggest Fix
            </button>

            <button
              onClick={() => send("parts")}
              className="px-3 py-1.5 rounded border text-xs"
              disabled={loading}
            >
              Predict Parts
            </button>

            <button
              onClick={() => send("summary")}
              className="px-3 py-1.5 rounded border text-xs"
              disabled={loading}
            >
              Write Summary
            </button>
          </div>

          {/* CUSTOM INPUT */}
          <div className="flex items-center gap-2 mt-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Copilot anything…"
              className="flex-1 border rounded-md px-3 py-2 text-sm"
              disabled={loading}
            />
            <button
              onClick={() => send("custom")}
              className="px-3 py-2 border rounded bg-black text-white text-sm"
              disabled={loading || !input.trim()}
            >
              Send
            </button>
          </div>

          {/* MESSAGE WINDOW */}
          <div className="border rounded-xl bg-gray-50 p-3 max-h-[300px] overflow-y-auto space-y-3">
            {messages.length === 0 && (
              <div className="text-gray-500 text-sm">
                Copilot is ready — ask anything about this service request.
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg text-sm whitespace-pre-wrap ${
                  m.role === "assistant"
                    ? "bg-white border"
                    : "bg-black text-white ml-6"
                }`}
              >
                {m.content}
              </div>
            ))}

            {loading && (
              <div className="text-gray-500 text-sm italic">Thinking…</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
