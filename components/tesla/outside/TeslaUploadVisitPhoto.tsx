"use client";

import { useState } from "react";

export default function TeslaUploadVisitPhoto({ leadId, onUploaded }: any) {
  const [loading, setLoading] = useState(false);

  async function handleUpload(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    const form = new FormData();
    form.append("file", file);

    const res = await fetch(`/api/outside-sales/leads/${leadId}/upload-photo`, {
      method: "POST",
      body: form,
    });
    const js = await res.json();

    setLoading(false);
    if (js.ok && onUploaded) onUploaded(js.url);
  }

  return (
    <label className="cursor-pointer inline-block">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />

      <div className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800">
        {loading ? "Uploading…" : "Upload Visit Photo"}
      </div>
    </label>
  );
}
