-- Create demo users tied to existing auth users by email (adjust emails)
-- Assumes table public.users has columns: id (uuid), email text, role text, company_id uuid, auth_user_id uuid


insert into public.users (email, role, company_id)
values
('admin@test.local','ADMIN','00000000-0000-0000-0000-000000000002'),
('office@test.local','OFFICE','00000000-0000-0000-0000-000000000002'),
('dispatch@test.local','DISPATCH','00000000-0000-0000-0000-000000000002'),
('tech@test.local','TECH','00000000-0000-0000-0000-000000000002'),
('customer@test.local','CUSTOMER','00000000-0000-0000-0000-000000000002')
ON CONFLICT (email) DO NOTHING;