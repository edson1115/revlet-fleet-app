// app/pdf/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";

export default function PDFSharePage({ params }: any) {
  const { id } = params;

  const [pdfUrl, setPdfUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let live = true;

    async function load() {
      try {
        // Log open-link
        await fetch("/api/pdf/log", {
          method: "POST",
          body: JSON.stringify({
            requestId: id,
            action: "open-link",
            actor: "public-view",
          }),
        });

        const res = await fetch(`/api/pdf/download/${id}`);

        if (!res.ok) throw new Error(await res.text());

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);

        if (live) setPdfUrl(url);
      } catch (e: any) {
        setErr(e.message || "Failed to load PDF");
      } finally {
        if (live) setLoading(false);
      }
    }

    load();
    return () => {
      live = false;
    };
  }, [id]);

  if (loading) return <div className="p-6">Loading PDF…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="p-4 border-b flex items-center justify-between bg-white">
        <h1 className="font-semibold">Service Request PDF</h1>
        <a
          href={`/api/pdf/download/${id}`}
          className="text-sm px-3 py-1 rounded-md bg-black text-white"
        >
          Download
        </a>
      </div>

      <iframe
        src={pdfUrl}
        className="w-full flex-1"
        style={{ border: "none" }}
      />
    </div>
  );
}
