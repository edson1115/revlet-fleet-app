import { supabaseServer } from '@/lib/supabaseServer';
import { Role } from '@/lib/status';
import Link from 'next/link';


export const dynamic = 'force-dynamic';


export default async function AdminPage() {
const sb = supabaseServer();
const { data: { user } } = await sb.auth.getUser();
if (!user) return <div className="p-6">Not signed in</div>;


const { data: me } = await sb.from('users').select('role').eq('auth_user_id', user.id).single();
if (me?.role !== 'ADMIN') return <div className="p-6">Admins only</div>;


const { data: rows } = await sb.from('users').select('id,email,role,company_id').order('email');


async function updateRole(formData: FormData) {
'use server';
const id = formData.get('id') as string;
const role = formData.get('role') as Role;
const sb2 = supabaseServer();


const { data: { user: u } } = await sb2.auth.getUser();
if (!u) throw new Error('Not signed in');
const { data: me2 } = await sb2.from('users').select('role').eq('auth_user_id', u.id).single();
if (me2?.role !== 'ADMIN') throw new Error('Admins only');


const { error } = await sb2.from('users').update({ role }).eq('id', id);
if (error) throw error;
}


const roles: Role[] = ['ADMIN','OFFICE','DISPATCH','TECH','CUSTOMER', null];


return (
<div className="p-6 space-y-6">
<h1 className="text-2xl font-semibold">Admin • Users</h1>
<div className="text-sm opacity-80">Manage roles for access control.
<span className="ml-2"><Link href="/">Home</Link></span>
</div>


<div className="grid gap-3">
{rows?.map((r) => (
<form key={r.id} action={updateRole} className="flex items-center gap-3 border p-3 rounded-xl">
<input type="hidden" name="id" value={r.id} />
<div className="w-64 font-mono text-sm">{r.email}</div>
<select name="role" defaultValue={r.role ?? ''} className="border rounded px-2 py-1">
{roles.map((role) => (
<option key={String(role)} value={role ?? ''}>{String(role ?? 'none')}</option>
))}
</select>
<button className="px-3 py-1.5 rounded bg-black text-white">Save</button>
</form>
))}
</div>
</div>
);
}