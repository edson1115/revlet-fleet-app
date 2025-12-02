"use client";

import React, { useState, useRef } from "react";

type Props = {
  requestId: string;
  onUploaded: (img: any) => void;
  onClose: () => void;
  autoCategoryFromStatus?: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
};

export default function TechPhotoUpload({
  requestId,
  onUploaded,
  onClose,
  autoCategoryFromStatus,
}: Props) {
  const [kind, setKind] = useState<"before" | "after" | "other">("before");
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progressText, setProgressText] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-category detection based on request status (optional)
  React.useEffect(() => {
    if (autoCategoryFromStatus === "SCHEDULED") setKind("before");
    else if (autoCategoryFromStatus === "IN_PROGRESS") setKind("after");
    else setKind("other");
  }, [autoCategoryFromStatus]);

  // ---------------------------------------------------------------------------
  // Handle file selection
  // ---------------------------------------------------------------------------
  async function handleSelect(e: any) {
    const files: File[] = Array.from(e.target.files || []);
    if (!files.length) return;

    setPreviewFiles(files);

    // Show preview of the first file
    const first = files[0];
    setPreviewURL(URL.createObjectURL(first));
  }

  // ---------------------------------------------------------------------------
  // Upload all selected files
  // ---------------------------------------------------------------------------
  async function uploadAll() {
    if (!previewFiles.length) return;

    try {
      setUploading(true);
      let index = 0;

      for (const file of previewFiles) {
        index++;
        setProgressText(`Uploading file ${index} of ${previewFiles.length}…`);

        const form = new FormData();
        form.append("file", file);
        form.append("request_id", requestId);
        form.append("kind", kind);

        const res = await fetch("/api/images/upload", {
          method: "POST",
          body: form,
          credentials: "include",
        });

        const js = await res.json();
        if (!res.ok) {
          throw new Error(js.error || "Upload failed");
        }

        // Return the inserted SQL row to parent
        onUploaded(js.image);
      }

      setToast({ type: "success", msg: "Uploaded successfully!" });

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      console.error(err);
      setToast({ type: "error", msg: err.message });
    } finally {
      setUploading(false);
      setProgressText(null);
    }
  }

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* TOAST */}
      {toast && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-white text-sm shadow-lg ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="bg-white w-full max-w-sm p-6 rounded-2xl shadow-xl animate-in fade-in duration-150 space-y-6">
        <h2 className="text-lg font-semibold text-center">Upload Photos</h2>

        {/* CATEGORY SELECT */}
        <div className="flex gap-2 justify-center">
          {["before", "after", "other"].map((k) => (
            <button
              key={k}
              onClick={() => setKind(k as any)}
              className={`px-3 py-1 rounded-full text-sm border transition ${
                kind === k ? "bg-black text-white" : "bg-gray-100"
              }`}
            >
              {k.toUpperCase()}
            </button>
          ))}
        </div>

        {/* PREVIEW */}
        {previewURL ? (
          <div className="space-y-4">
            <img
              src={previewURL}
              className="w-full h-52 rounded-xl object-cover border shadow-sm"
            />

            {/* MULTI UPLOAD PROGRESS */}
            {uploading && progressText && (
              <div className="text-center text-sm text-gray-600">
                {progressText}
              </div>
            )}

            <div className="flex gap-2">
              {/* Retake */}
              <button
                onClick={() => {
                  setPreviewFiles([]);
                  setPreviewURL(null);
                  inputRef.current?.click();
                }}
                disabled={uploading}
                className="w-1/2 py-3 rounded-xl bg-gray-200 text-gray-700 font-semibold"
              >
                Retake
              </button>

              {/* Upload */}
              <button
                onClick={uploadAll}
                disabled={uploading}
                className="w-1/2 py-3 rounded-xl bg-black text-white font-semibold"
              >
                {uploading ? "Uploading…" : "Upload"}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* FILE SELECT BUTTON */}
            <label className="block w-full">
              <div className="w-full py-3 rounded-xl bg-black text-white font-semibold text-center">
                Choose Photos
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                onChange={handleSelect}
                className="hidden"
              />
            </label>

            {/* CANCEL */}
            <button
              onClick={onClose}
              className="w-full py-2 rounded-xl bg-gray-200 text-gray-700"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
