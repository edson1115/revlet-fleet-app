"use client";

import { useState } from "react";

export default function BulkPDFButton({
  selectedIds,
}: {
  selectedIds: string[];
}) {
  const [loading, setLoading] = useState(false);

  async function handleBulk() {
    if (!selectedIds.length) {
      alert("Select at least one request.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/pdf/bulk", {
        method: "POST",
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!res.ok) throw new Error(await res.text());

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "requests.zip";
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      alert("Failed to export PDFs.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleBulk}
      disabled={loading || selectedIds.length === 0}
      className="px-4 py-2 bg-black text-white rounded-lg text-sm disabled:opacity-40"
    >
      {loading ? "Exporting…" : `Export PDFs (${selectedIds.length})`}
    </button>
  );
}



