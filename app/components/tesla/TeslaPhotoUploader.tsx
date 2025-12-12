"use client";

import { useState } from "react";

export function TeslaPhotoUploader({ onChange }: { onChange: (file: File | null) => void }) {
  const [preview, setPreview] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    onChange(file);

    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-medium mb-2">Upload Photo</label>

      <div className="border border-gray-300 rounded-xl p-4 text-center bg-white shadow-sm">
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="w-full h-56 object-cover rounded-xl mb-3 shadow"
          />
        ) : (
          <div className="text-gray-400 text-sm mb-3">No photo selected</div>
        )}

        <input
          type="file"
          accept="image/*"
          className="w-full text-sm"
          onChange={handleFile}
        />
      </div>
    </div>
  );
}
