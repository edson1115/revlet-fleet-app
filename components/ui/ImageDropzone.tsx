"use client";

import { useState, useRef } from "react";
import clsx from "clsx";

type Props = {
  onFilesSelected: (files: File[]) => void;
  existingFiles?: File[];
  onRemove?: (index: number) => void;
};

export default function ImageDropzone({ onFilesSelected, existingFiles = [], onRemove }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
    else if (e.type === "dragleave") setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  return (
    <div className="space-y-4">
      {/* DROP AREA */}
      <div
        className={clsx(
          "border-2 border-dashed rounded-2xl p-8 text-center transition cursor-pointer flex flex-col items-center justify-center gap-2 group",
          isDragging ? "border-black bg-zinc-50" : "border-zinc-200 hover:border-zinc-400"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleChange} />
        <div className={clsx("p-3 rounded-full transition", isDragging ? "bg-black text-white" : "bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200")}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </div>
        <div>
            <p className="font-bold text-sm text-zinc-900">Click or Drag Photos Here</p>
            <p className="text-xs text-zinc-400 mt-1">Upload damage or issue photos</p>
        </div>
      </div>

      {/* PREVIEW GRID */}
      {existingFiles.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {existingFiles.map((file, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200 group">
              <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-red-600 transition backdrop-blur-sm"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}