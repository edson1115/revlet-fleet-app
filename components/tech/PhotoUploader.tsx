// components/tech/PhotoUploader.tsx
"use client";
import { useState } from "react";
import { uploadProofImage } from "@/lib/images/client";

export default function PhotoUploader({
  requestId,
  kind,
  onUploaded,
}: {
  requestId: string;
  kind: "before" | "after" | "other";
  onUploaded?: (res: { id: string; url_work: string; url_thumb: string }) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    setErr(null);
    try {
      const out = await uploadProofImage({ file: f, request_id: requestId, kind });
      onUploaded?.(out);
    } catch (e: any) {
      setErr(e?.message || "Upload failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label className="cursor-pointer border rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50">
        {busy ? "Uploading…" : `Add ${kind} photo`}
        <input type="file" accept="image/*" capture="environment" hidden onChange={onPick} />
      </label>
      {err && <span className="text-xs text-red-600">{err}</span>}
    </div>
  );
}
