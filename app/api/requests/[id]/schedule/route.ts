import { NextResponse } from 'next/server';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const incoming = await req.json().catch(() => ({}));
  const res = await fetch(new URL(`/api/requests/${id}/transition`, new URL(req.url).origin), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: 'SCHEDULED', po_number: incoming?.po_number }),
  });
  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
