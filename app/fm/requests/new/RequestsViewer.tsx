// app/fm/requests/new/RequestsViewer.tsx

"use client";

type SR = {
  id: string;
  vehicle?: any[] | any | null;
  customer?: any[] | any | null;
  service?: string | null;
  status?: string | null;
};

function normalize(row: any) {
  return {
    ...row,
    vehicle: Array.isArray(row.vehicle) ? row.vehicle[0] : row.vehicle ?? null,
    customer: Array.isArray(row.customer) ? row.customer[0] : row.customer ?? null,
  };
}

function Item({ r }: { r: SR }) {
  const row = normalize(r);

  const v = row.vehicle ?? {};

  const vehicle =
    [
      v.year,
      v.make,
      v.model,
      v.plate || v.unit_number,
    ]
      .filter(Boolean)
      .join(" ") || "—";

  const customer = row.customer?.name || "—";

  return (
    <div className="border p-4 rounded mb-3">
      <div className="font-semibold">{vehicle}</div>
      <div className="text-sm text-gray-600">{customer}</div>
      <div className="text-xs mt-1">Service: {row.service || "—"}</div>
      <div className="text-xs">Status: {row.status || "—"}</div>
    </div>
  );
}

export default function RequestsViewer({ rows }: { rows: SR[] }) {
  return (
    <div className="space-y-3">
      {(rows ?? []).map((r) => (
        <Item key={r.id} r={r} />
      ))}
    </div>
  );
}
