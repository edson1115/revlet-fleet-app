import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';


export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
const { id } = await params;
const sb = supabaseServer();
const { data, error } = await sb
.from('service_request_notes')
.select('id,body,created_at,author_user_id, author:users(email)')
.eq('request_id', id)
.order('created_at', { ascending: true });
if (error) return NextResponse.json({ error: error.message }, { status: 500 });
return NextResponse.json({ rows: data });
}


export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
const { id } = await params;
const sb = supabaseServer();
const { data: { user } } = await sb.auth.getUser();
if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });


const { data: me } = await sb.from('users').select('id,role').eq('auth_user_id', user.id).single();
if (!me) return NextResponse.json({ error: 'User not found' }, { status: 403 });
if (!['ADMIN','OFFICE','DISPATCH','TECH'].includes(me.role)) {
return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
}


const body = (await req.json()) as { body: string };
const text = (body?.body || '').trim();
if (!text) return NextResponse.json({ error: 'Note text required' }, { status: 400 });


const { data, error } = await sb
.from('service_request_notes')
.insert({ request_id: id, author_user_id: me.id, body: text })
.select('id,body,created_at,author_user_id')
.single();
if (error) return NextResponse.json({ error: error.message }, { status: 500 });
return NextResponse.json({ ok: true, row: data });
}