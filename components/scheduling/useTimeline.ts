export function snapTo30(mins: number) {
  const snapped = Math.round(mins / 30) * 30;
  return Math.max(0, Math.min(1440, snapped));
}
