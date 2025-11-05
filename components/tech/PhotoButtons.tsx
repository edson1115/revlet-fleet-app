"use client";

import React, { useRef, useState } from "react";

type Kind = "before" | "after" | "other";

async function uploadRequestImage(requestId: string, kind: Kind, file: File) {
  const fd = new FormData();
  fd.append("request_id", requestId);
  fd.append("kind", kind);
  // IMPORTANT: the field MUST be named exactly "file"
  fd.append("file", file);

  // DO NOT set Content-Type manually when sending FormData
  const res = await fetch("/api/images/upload", {
    method: "POST",
    body: fd,
    credentials: "include",
  });

  const js = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(js?.error || "Upload failed");
  return js;
}

export function PhotoButtons({
  requestId,
  onUploaded,
}: {
  requestId: string;
  onUploaded?: (payload: any) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [kind, setKind] = useState<Kind>("before");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function pick(k: Kind) {
    setKind(k);
    fileRef.current?.click();
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      setErr(null);
      const f = e.target.files?.[0];
      // Reset value so selecting the same file twice still triggers onChange
      e.target.value = "";

      if (!f) {
        setErr("No file selected.");
        return;
      }
      setBusy(true);
      const out = await uploadRequestImage(requestId, kind, f);
      onUploaded?.(out);
    } catch (e: any) {
      setErr(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPick}
      />
      <button
        type="button"
        className="border rounded-lg px-2.5 py-1.5 text-sm hover:bg-gray-50"
        onClick={() => pick("before")}
        disabled={busy}
      >
        {busy && kind === "before" ? "Uploading…" : "Before photo"}
      </button>
      <button
        type="button"
        className="border rounded-lg px-2.5 py-1.5 text-sm hover:bg-gray-50"
        onClick={() => pick("after")}
        disabled={busy}
      >
        {busy && kind === "after" ? "Uploading…" : "After photo"}
      </button>
      <button
        type="button"
        className="border rounded-lg px-2.5 py-1.5 text-sm hover:bg-gray-50"
        onClick={() => pick("other")}
        disabled={busy}
      >
        {busy && kind === "other" ? "Uploading…" : "Other"}
      </button>
      {err ? <span className="text-xs text-red-600 ml-2">{err}</span> : null}
    </div>
  );
}
