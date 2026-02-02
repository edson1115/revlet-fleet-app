"use client";

import React, { useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Props = {
  requestId: string;
  onUploaded: (img: any) => void;
  onClose: () => void;
  autoCategoryFromStatus?: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
};

export default function TechPhotoUpload({ requestId, onUploaded, onClose, autoCategoryFromStatus }: Props) {
  const [kind, setKind] = useState<"before" | "after" | "other">("before");
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  React.useEffect(() => {
    if (autoCategoryFromStatus === "SCHEDULED") setKind("before");
    else if (autoCategoryFromStatus === "IN_PROGRESS") setKind("after");
    else setKind("other");
  }, [autoCategoryFromStatus]);

  async function handleSelect(e: any) {
    const files: File[] = Array.from(e.target.files || []);
    if (files.length) setPreviewFiles(files);
  }

  async function uploadAll() {
    if (!previewFiles.length) return;
    setUploading(true);

    try {
      for (const file of previewFiles) {
        const ext = file.name.split(".").pop();
        const fileName = `${requestId}/${Date.now()}_${kind}.${ext}`;

        // 1. Upload to Storage
        const { error: uploadErr } = await supabase.storage
          .from("request-images")
          .upload(fileName, file);

        if (uploadErr) throw uploadErr;

        // 2. Get URL
        const { data: { publicUrl } } = supabase.storage.from("request-images").getPublicUrl(fileName);

        // 3. Insert into DB
        const { data: row, error: dbErr } = await supabase
          .from("request_images")
          .insert({
            request_id: requestId,
            url_full: publicUrl,
            kind: kind
          })
          .select()
          .single();

        if (!dbErr && row) onUploaded(row);
      }
      onClose();
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm p-6 rounded-3xl shadow-2xl space-y-6">
        <h2 className="text-lg font-black text-center uppercase tracking-tight">Upload Evidence</h2>

        {/* Category Toggles */}
        <div className="flex gap-2 justify-center">
          {["before", "after", "other"].map((k) => (
            <button
              key={k}
              onClick={() => setKind(k as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition ${
                kind === k ? "bg-black text-white shadow-md" : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        {/* Preview / Select */}
        <div 
            onClick={() => inputRef.current?.click()}
            className="aspect-square bg-zinc-100 rounded-2xl border-2 border-dashed border-zinc-300 flex items-center justify-center cursor-pointer hover:border-black transition overflow-hidden relative"
        >
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleSelect} />
            
            {previewFiles.length > 0 ? (
                <img src={URL.createObjectURL(previewFiles[0])} className="w-full h-full object-cover" />
            ) : (
                <div className="text-center">
                    <div className="text-2xl mb-2">📸</div>
                    <p className="text-xs font-bold text-zinc-400 uppercase">Tap to Select</p>
                </div>
            )}
        </div>

        <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-zinc-500 bg-zinc-100">Cancel</button>
            <button 
                onClick={uploadAll} 
                disabled={uploading || previewFiles.length === 0}
                className="flex-[2] py-3 rounded-xl font-bold text-white bg-black shadow-lg disabled:opacity-50"
            >
                {uploading ? "Uploading..." : `Upload ${previewFiles.length > 0 ? `(${previewFiles.length})` : ""}`}
            </button>
        </div>
      </div>
    </div>
  );
}