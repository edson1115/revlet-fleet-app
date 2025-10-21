'use server';
import { supabaseServer } from '@/lib/supabase/server';


export async function createRequest(formData: FormData) {
const sb = supabaseServer();
const payload = {
vehicle_id: formData.get('vehicle_id'),
location_id: formData.get('location_id'),
customer_id: formData.get('customer_id'),
service: formData.get('service'),
fmc: formData.get('fmc'),
mileage: formData.get('mileage') ? Number(formData.get('mileage')) : null,
};
const { data, error } = await sb.from('service_requests').insert(payload).select('id').single();
if (error) throw new Error(error.message);
return { id: data.id };
}
