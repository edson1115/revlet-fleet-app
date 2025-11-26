-- 0) Make sure status always has a value (defensive)
alter table if exists public.service_requests
  alter column status set default 'NEW';

-- 1) Null out orphaned location/customer references so the FKs can be validated
update public.service_requests sr
set location_id = null
where sr.location_id is not null
  and not exists (select 1 from public.locations l where l.id = sr.location_id);

update public.service_requests sr
set customer_id = null
where sr.customer_id is not null
  and not exists (select 1 from public.customers c where c.id = sr.customer_id);

-- 2) (Re)create forgiving FKs: ON UPDATE CASCADE, ON DELETE SET NULL, start as NOT VALID
do $$
begin
  if exists (select 1 from information_schema.table_constraints
             where table_name='service_requests' and constraint_name='fk_service_requests_location') then
    alter table public.service_requests drop constraint fk_service_requests_location;
  end if;
end $$;

do $$
begin
  if exists (select 1 from information_schema.table_constraints
             where table_name='service_requests' and constraint_name='fk_service_requests_customer') then
    alter table public.service_requests drop constraint fk_service_requests_customer;
  end if;
end $$;

alter table public.service_requests
  add constraint fk_service_requests_location
  foreign key (location_id) references public.locations(id)
  on update cascade on delete set null
  not valid;

alter table public.service_requests
  add constraint fk_service_requests_customer
  foreign key (customer_id) references public.customers(id)
  on update cascade on delete set null
  not valid;

-- 3) Validate the constraints against current data (now clean)
alter table public.service_requests validate constraint fk_service_requests_location;
alter table public.service_requests validate constraint fk_service_requests_customer;

-- 4) Helpful indexes for queue performance
create index if not exists idx_service_requests_status on public.service_requests(status);
create index if not exists idx_service_requests_scheduled_at on public.service_requests(scheduled_at) where status = 'SCHEDULED';
create index if not exists idx_service_requests_started_at on public.service_requests(started_at) where status in ('IN_PROGRESS','RESCHEDULED');

-- 5) Sanity check: prevent negative mileage (optional)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'chk_service_requests_mileage_nonneg') then
    alter table public.service_requests
      add constraint chk_service_requests_mileage_nonneg check (mileage is null or mileage >= 0);
  end if;
end $$;
