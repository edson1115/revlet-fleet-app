"use client";

import { useState } from "react";

export default function VisitUpload({ leadId }: any) {
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  async function upload(e: any) {
    const fileList = e.target.files;
    if (!fileList?.length) return;

    setUploading(true);

    for (const file of fileList) {
      const form = new FormData();
      form.append("file", file);
      form.append("lead_id", leadId);

      await fetch("/api/sales/visit-photos/upload", {
        method: "POST",
        body: form,
      });
    }

    setUploading(false);
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg">Visit Photos</h3>

      <input
        type="file"
        multiple
        onChange={upload}
        className="block w-full text-sm text-gray-700"
      />

      {uploading && <div className="text-blue-600">Uploading…</div>}
    </div>
  );
}
