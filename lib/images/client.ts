// lib/images/client.ts
// Browser-only helpers: compress image to WebP, make 1280px work + 320px thumb,
// compute SHA-256 (hex), and run sign → PUT → commit.

export type Kind = "before" | "after" | "other";

export async function fileToImageBitmap(file: File) {
  const blob = new Blob([await file.arrayBuffer()], { type: file.type || "image/*" });
  return await createImageBitmap(blob);
}

function drawToCanvas(img: ImageBitmap, maxEdge: number) {
  const { width: w0, height: h0 } = img;
  const scale = Math.min(1, maxEdge / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * scale));
  const h = Math.max(1, Math.round(h0 * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d", { alpha: false })!;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

async function canvasToWebPBlob(canvas: HTMLCanvasElement, quality = 0.7): Promise<Blob> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/webp", quality);
  });
  return blob;
}

export async function sha256Hex(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function putSigned(url: string, blob: Blob, cacheControl?: string) {
  const res = await fetch(url, {
    method: "PUT",
    headers: cacheControl ? { "Cache-Control": cacheControl } : undefined,
    body: blob,
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
}

export async function uploadProofImage(opts: {
  file: File;
  request_id: string;
  kind: Kind;
  qualityWork?: number;   // default 0.7
  qualityThumb?: number;  // default 0.7
}) {
  const { file, request_id, kind, qualityWork = 0.7, qualityThumb = 0.7 } = opts;
  const bmp = await fileToImageBitmap(file);

  // Work (≤1280) + Thumb (≤320)
  const workCanvas = drawToCanvas(bmp, 1280);
  const thumbCanvas = drawToCanvas(bmp, 320);

  const workBlob = await canvasToWebPBlob(workCanvas, qualityWork);
  const thumbBlob = await canvasToWebPBlob(thumbCanvas, qualityThumb);

  const sha256 = await sha256Hex(workBlob);

  // 1) sign
  const signRes = await fetch("/api/images/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      request_id,
      kind,
      sha256,
      width: workCanvas.width,
      height: workCanvas.height,
      size_bytes: workBlob.size,
      thumb_bytes: thumbBlob.size,
    }),
  }).then((r) => r.json());

  if (signRes.error) throw new Error(signRes.error);

  if (!signRes.reused) {
    // 2) upload via signed URLs
    const cacheCtl = signRes.cache_control || "public, max-age=31536000, immutable";
    await putSigned(signRes.upload_work, workBlob, cacheCtl);
    await putSigned(signRes.upload_thumb, thumbBlob, cacheCtl);
  }

  // 3) commit (optional blurhash later)
  await fetch("/api/images/commit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      id: signRes.id,
      size_bytes: workBlob.size,
      thumb_bytes: thumbBlob.size,
      blurhash: null,
    }),
  });

  return {
    id: signRes.id,
    url_work: signRes.url_work as string,
    url_thumb: signRes.url_thumb as string,
  };
}
