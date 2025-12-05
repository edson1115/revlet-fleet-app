"use client";

import { useState } from "react";

export default function PDFShareButton({ requestId }: { requestId: string }) {
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/pdf/share`, {
        method: "POST",
        body: JSON.stringify({ requestId }),
      });
      const js = await res.json();

      if (js.url) {
        navigator.clipboard.writeText(js.url);
        alert("Share link copied to clipboard!");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      disabled={loading}
      onClick={generate}
      className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50"
    >
      {loading ? "Sharing..." : "Share PDF"}
    </button>
  );
}



