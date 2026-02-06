"use client";

import { useState } from "react";

export default function VisitUpload({ leadId }: any) {
  const [uploading, setUploading] = useState(false);

  async function upload(e: any) {
    const fileList = e.target.files;
    if (!fileList?.length) return;

    setUploading(true);

    try {
      for (const file of Array.from(fileList as FileList)) {
        const form = new FormData();
        form.append("file", file);
        form.append("lead_id", leadId);

        await fetch("/api/sales/visit-photos/upload", {
          method: "POST",
          body: form,
        });
      }
      // Optional: Refresh data here if needed
      alert("Photos uploaded successfully.");
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload photos.");
    } finally {
      setUploading(false);
      // Reset the input so users can upload the same file again if needed
      e.target.value = null;
    }
  }

  return (
    <div className="space-y-3 p-4 border-t">
      <h3 className="font-semibold text-lg">Visit Photos</h3>

      <div className="relative">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={upload}
          disabled={uploading}
          className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
        />
      </div>

      {uploading && <div className="text-blue-600 text-sm font-medium animate-pulse">Uploading photos...</div>}
    </div>
  );
}