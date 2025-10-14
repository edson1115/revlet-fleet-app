// app/lib/format.ts
export type Customer = { name?: string | null };
export type VehicleLite = { year?: number; make?: string; model?: string; unit_number?: string | null };

export const customerName = (c?: Customer | null) => c?.name ?? '—';

export const vehicleLabel = (v?: VehicleLite | null) => {
  if (!v) return '—';
  const unit = v.unit_number ? ` (${v.unit_number})` : '';
  return `${v.year ?? ''} ${v.make ?? ''} ${v.model ?? ''}${unit}`.trim();
};
