"use client";

import { useRef } from "react";

export default function TeslaPhotoUploader({
  files,
  setFiles,
}: {
  files: File[];
  setFiles: (f: File[]) => void;
}) {
  const inputRef = useRef<any>(null);

  function handleSelect(e: any) {
    const selected = Array.from(e.target.files || []);
    setFiles([...files, ...selected]);
  }

  function remove(index: number) {
    const copy = [...files];
    copy.splice(index, 1);
    setFiles(copy);
  }

  return (
    <div className="space-y-3">
      {/* Button */}
      <button
        type="button"
        className="w-full border border-gray-300 rounded-xl py-3 text-sm font-medium hover:bg-gray-100"
        onClick={() => inputRef.current?.click()}
      >
        Upload Photos
      </button>

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleSelect}
      />

      {/* Previews */}
      <div className="grid grid-cols-3 gap-3">
        {files.map((f, i) => (
          <div key={i} className="relative">
            <img
              src={URL.createObjectURL(f)}
              className="rounded-xl object-cover h-24 w-full"
            />
            <button
              type="button"
              className="absolute top-1 right-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded"
              onClick={() => remove(i)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
