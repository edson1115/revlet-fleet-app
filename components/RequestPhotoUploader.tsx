"use client";

import { useState, useRef } from "react";
import { useRequestPhotos } from "@/lib/hooks/useRequestPhotos";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const BUCKET = "request-photos";

export default function RequestPhotoUploader({ requestId }: { requestId: string }) {
  const supabase = createClientComponentClient();
  const { uploadPhoto, photos, isLoading } = useRequestPhotos(requestId);

  const inputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<"BEFORE" | "AFTER" | "OTHER">("BEFORE");
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: any) {
    try {
      setUploading(true);
      const file: File | null = e.target.files?.[0] ?? null;
      if (!file) return;

      const ext = file.name.split(".").pop();
      const path = `${requestId}/${Date.now()}.${ext}`;

      // Upload to Supabase Storage
      const { data, error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file);

      if (uploadErr) throw uploadErr;

      // Make URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(path);

      // Save into request_photos table
      await uploadPhoto({
        url: publicUrl,
        kind,
      });

      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4 p-4 border rounded-xl bg-white shadow">
      <h3 className="font-semibold text-lg">Upload Photos</h3>

      {/* Select BEFORE / AFTER / OTHER */}
      <div className="flex items-center gap-3">
        <label className="font-medium text-sm">Type:</label>
        <select
          className="border rounded px-2 py-1"
          value={kind}
          onChange={(e) => setKind(e.target.value as any)}
        >
          <option value="BEFORE">Before</option>
          <option value="AFTER">After</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* Upload Input */}
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        onChange={handleUpload}
        className="block text-sm"
      />

      {uploading && <p className="text-blue-600 text-sm">Uploading...</p>}

      <hr />

      <h4 className="font-medium text-sm mb-2">Uploaded Photos</h4>

      {isLoading ? (
        <p className="text-sm text-gray-600">Loading...</p>
      ) : photos.length === 0 ? (
        <p className="text-sm text-gray-500">No photos yet</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {photos.map((p) => (
            <div key={p.id} className="border p-2 rounded shadow-sm bg-gray-50">
              <img src={p.url} className="w-full rounded" />
              <p className="text-xs text-center mt-1">{p.kind ?? "OTHER"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



