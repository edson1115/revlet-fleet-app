import { NextResponse } from 'next/server';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(new URL(`/api/requests/${id}/transition`, new URL(req.url).origin), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: 'COMPLETED' }),
  });
  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
