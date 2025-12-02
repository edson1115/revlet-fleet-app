"use client";

import { useState } from "react";

export default function PDFButton({ requestId }: { requestId: string }) {
  const [loading, setLoading] = useState(false);

  async function download() {
    setLoading(true);
    try {
      const url = `/api/pdf/request/${encodeURIComponent(requestId)}`;
      window.open(url, "_blank");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={download}
      disabled={loading}
      className="px-4 py-2 rounded-lg bg-black text-white text-sm disabled:opacity-50"
    >
      {loading ? "Generating…" : "Download PDF"}
    </button>
  );
}
