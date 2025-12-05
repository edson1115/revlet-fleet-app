// lib/vehicleLabel.ts
export type Vehicle = {
  id: string;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  vin?: string | null;
  unit_number?: string | null;
  plate?: string | null;
};

function titleCase(s?: string | null) {
  if (!s) return '';
  return s
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

export function vehicleLabel(v?: Vehicle | null) {
  if (!v) return 'Vehicle';
  const left = [v.year && String(v.year), titleCase(v.make), titleCase(v.model)]
    .filter(Boolean)
    .join(' ');
  const right = v.unit_number || v.plate || (v.vin ? `VIN ${v.vin.slice(-6)}` : '');
  return [left, right && `• ${right}`].filter(Boolean).join(' ');
}



