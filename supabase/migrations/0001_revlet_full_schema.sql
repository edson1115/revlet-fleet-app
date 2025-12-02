-- ============================================
-- REVLET FLEET — FULL TESLA PRODUCTION SCHEMA
-- ============================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ------------------------------------------------
-- ENUMS
-- ------------------------------------------------
create type role_type as enum (
  'SUPERADMIN',
  'ADMIN',
  'OFFICE',
  'DISPATCH',
  'TECH',
  'CUSTOMER',
  'CUSTOMER_USER'
);

create type request_status as enum (
  'WAITING_TO_BE_SCHEDULED',
  'SCHEDULED',
  'RESCHEDULE',
  'IN_PROGRESS',
  'COMPLETED'
);

-- ------------------------------------------------
-- PROFILES
-- ------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  label text,
  phone text,
  role role_type default 'TECH',
  company_id uuid,
  customer_id uuid,
  location_id uuid,
  active boolean default true,
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- index help
create index if not exists profiles_role_idx on profiles(role);
create index if not exists profiles_customer_idx on profiles(customer_id);
create index if not exists profiles_location_idx on profiles(location_id);

-- auto-update updated_at
create or replace function update_profiles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_update_profiles on profiles;

create trigger trg_update_profiles
before update on profiles
for each row execute function update_profiles_updated_at();

-- ------------------------------------------------
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, role, active)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'TECH',
    true
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ------------------------------------------------
-- USER_MARKETS
-- ------------------------------------------------
create table if not exists public.user_markets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  market text not null,
  created_at timestamptz default now()
);

create index if not exists user_markets_user_idx on user_markets(user_id);

-- ------------------------------------------------
-- CUSTOMERS
-- ------------------------------------------------
create table if not exists public.customers (
  id uuid primary key default uuid_generate_v4(),
  name text,
  market text,
  active boolean default true,
  created_at timestamptz default now()
);

-- ------------------------------------------------
-- LOCATIONS
-- ------------------------------------------------
create table if not exists public.locations (
  id uuid primary key default uuid_generate_v4(),
  name text,
  market text,
  created_at timestamptz default now()
);

-- ------------------------------------------------
-- VEHICLES
-- ------------------------------------------------
create table if not exists public.vehicles (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references customers(id),
  unit_number text,
  plate text,
  vin text,
  year integer,
  make text,
  model text,
  market text,
  created_at timestamptz default now()
);

create index if not exists vehicles_customer_idx on vehicles(customer_id);

-- ------------------------------------------------
-- SERVICE REQUESTS
-- ------------------------------------------------
create table if not exists public.service_requests (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references customers(id),
  vehicle_id uuid references vehicles(id),
  location_id uuid references locations(id),
  technician_id uuid references profiles(id),
  status request_status default 'WAITING_TO_BE_SCHEDULED',
  service text,
  po text,
  mileage integer,
  notes text,
  ai_status text,
  ai_po_number text,
  created_by uuid references profiles(id),
  scheduled_at timestamptz,
  scheduled_end_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists sr_customer_idx on service_requests(customer_id);
create index if not exists sr_vehicle_idx on service_requests(vehicle_id);
create index if not exists sr_status_idx on service_requests(status);

-- ------------------------------------------------
-- SCHEDULE BLOCKS (tech assignments)
-- ------------------------------------------------
create table if not exists public.schedule_blocks (
  id uuid primary key default uuid_generate_v4(),
  request_id uuid references service_requests(id) on delete cascade,
  technician_id uuid references profiles(id),
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists sb_request_idx on schedule_blocks(request_id);

-- ------------------------------------------------
-- REQUEST IMAGES
-- ------------------------------------------------
create table if not exists public.request_images (
  id uuid primary key default uuid_generate_v4(),
  request_id uuid references service_requests(id),
  bucket text,
  path text,
  url_full text,
  url_thumb text,
  kind text,
  ai_labels text[],
  ai_damage_detected boolean default false,
  created_at timestamptz default now()
);

create index if not exists ri_request_idx on request_images(request_id);

-- ------------------------------------------------
-- LOGS
-- ------------------------------------------------
create table if not exists public.request_logs (
  id uuid primary key default uuid_generate_v4(),
  request_id uuid references service_requests(id),
  message text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ------------------------------------------------
-- RLS POLICIES
-- ------------------------------------------------

-- PROFILES
alter table public.profiles enable row level security;

create policy "read own profile"
on profiles for select
using (auth.uid() = id);

create policy "update own profile"
on profiles for update
using (auth.uid() = id);

-- SERVICE REQUESTS
alter table public.service_requests enable row level security;

create policy "internal read"
on service_requests for select
using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid()
    and p.role in ('SUPERADMIN','ADMIN','OFFICE','DISPATCH')
  )
);

create policy "customer read own"
on service_requests for select
using (
  service_requests.customer_id = (
    select customer_id from profiles where id = auth.uid()
  )
);

create policy "insert internal"
on service_requests for insert
with check (
  exists (
    select 1 from profiles p
    where p.id = auth.uid()
    and p.role in ('SUPERADMIN','ADMIN','OFFICE','DISPATCH')
  )
);

create policy "update internal"
on service_requests for update
using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid()
    and p.role in ('SUPERADMIN','ADMIN','OFFICE','DISPATCH')
  )
);

-- REQUEST IMAGES
alter table public.request_images enable row level security;

create policy "read images"
on request_images for select
using (true);

create policy "insert images"
on request_images for insert
with check (auth.uid() is not null);

-- USER MARKETS
alter table public.user_markets enable row level security;

create policy "read own markets"
on user_markets for select
using (user_id = auth.uid());

create policy "insert service"
on user_markets for insert
with check (auth.role() = 'service_role');
