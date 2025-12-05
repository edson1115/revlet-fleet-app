"use client";

import { useState, useRef } from "react";

type Props = {
  requestId: string;
  onUploaded?: (img: any) => void; // callback to refresh parent
  onClose: () => void;
};

const PHOTO_KINDS = [
  { key: "FRONT", label: "Front" },
  { key: "REAR", label: "Rear" },
  { key: "LEFT", label: "Left Side" },
  { key: "RIGHT", label: "Right Side" },
  { key: "DASH", label: "Dashboard" },
  { key: "OTHER", label: "Other" },
];

export default function RequestPhotoUploader({ requestId, onUploaded, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState("FRONT");
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // -----------------------------
  // FILE SELECTION + PREVIEW
  // -----------------------------
  const onSelectFile = (e: any) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;

    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  // -----------------------------
  // UPLOAD
  // -----------------------------
  const upload = async () => {
    if (!file) return;

    setUploading(true);

    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);

    const res = await fetch(`/api/customer/requests/${requestId}/upload-photo`, {
      method: "POST",
      body: form,
    });

    const js = await res.json();
    setUploading(false);

    if (!res.ok) {
      alert(js.error || "Upload failed");
      return;
    }

    onUploaded?.(js.image);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-6">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Upload Photo</h2>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-black">
            ✕
          </button>
        </div>

        {/* KIND SELECTOR */}
        <label className="text-sm font-medium">Photo Type</label>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mt-1 mb-4 bg-gray-100"
        >
          {PHOTO_KINDS.map((k) => (
            <option key={k.key} value={k.key}>
              {k.label}
            </option>
          ))}
        </select>

        {/* UPLOAD AREA */}
        <div
          className="
            border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
            hover:bg-gray-50 transition
          "
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          {!preview && (
            <div>
              <p className="text-gray-600 text-sm">Drag & drop a photo here</p>
              <p className="text-gray-400 text-xs mt-1">or click to browse</p>
            </div>
          )}

          {preview && (
            <img
              src={preview}
              className="w-full rounded-xl border mt-2 object-cover max-h-64"
            />
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onSelectFile}
          />
        </div>

        {/* BUTTONS */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 border rounded-lg py-2 text-gray-700"
          >
            Cancel
          </button>

          <button
            disabled={uploading || !file}
            onClick={upload}
            className="
              flex-1 bg-black text-white rounded-lg py-2 
              disabled:opacity-40 hover:bg-gray-800 transition
            "
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}



