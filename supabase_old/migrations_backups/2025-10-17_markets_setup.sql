-- helpers
create or replace function public.auth_company_id()
returns uuid language sql security definer stable as $$
  select company_id from public.profiles where id = auth.uid()
$$;

-- locations
alter table public.company_locations
  add column if not exists location_type text
  check (location_type in ('MARKET','SITE'));
alter table public.company_locations enable row level security;
create policy if not exists read_locations_by_company
  on public.company_locations for select
  using (company_id = public.auth_company_id());

-- unique index for upsert
create unique index if not exists company_locations_company_name_uniq
  on public.company_locations (company_id, name);

-- customers
alter table public.company_customers
  add column if not exists market text;
create index if not exists company_customers_company_market_idx
  on public.company_customers (company_id, market);
