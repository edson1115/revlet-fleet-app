// components/auto-integrate/AiStructuredOutput.tsx
"use client";

import { useState } from "react";

export default function AiStructuredOutput({ aiText }: { aiText: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(aiText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="border rounded-lg p-4 bg-white shadow-md">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-semibold text-lg">AutoIntegrate-Ready Output</h2>
        <button
          onClick={copy}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {copied ? "Copied!" : "Copy to Clipboard"}
        </button>
      </div>

      <textarea
        className="w-full border rounded-md p-3 h-64 font-mono text-sm"
        readOnly
        value={aiText}
      />
    </div>
  );
}
