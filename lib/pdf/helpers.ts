// lib/pdf/helpers.ts
export function safe(v: any, fallback = "—") {
  if (v === null || v === undefined) return fallback;
  if (v === "") return fallback;
  return v;
}
