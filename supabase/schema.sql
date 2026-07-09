-- Wonderlust Next — Supabase schema
-- Tables from SPEC.md, plus columns the reference design requires
-- (services.category / price_display / sort_order for the grouped menu with
-- literal prices like "$80+" and "consult"; stylists.role for the team cards).
-- Run against your Supabase project: psql or the SQL editor.

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  price numeric(10, 2),
  price_display text,
  deposit_amount numeric(10, 2),
  duration_minutes integer,
  full_prepayment boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists stylists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  bio text,
  photo_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists availability (
  id uuid primary key default gen_random_uuid(),
  stylist_id uuid not null references stylists (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  active boolean not null default true
);

create table if not exists blocked_dates (
  id uuid primary key default gen_random_uuid(),
  stylist_id uuid not null references stylists (id) on delete cascade,
  date date not null,
  reason text
);

create table if not exists business_hours (
  id uuid primary key default gen_random_uuid(),
  day_of_week smallint not null unique check (day_of_week between 0 and 6),
  opens time,
  closes time,
  closed boolean not null default false
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services (id),
  stylist_id uuid not null references stylists (id),
  client_name text not null,
  client_email text not null,
  client_phone text not null,
  appointment_date date not null,
  appointment_time time not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'deposit_paid', 'paid', 'refunded')),
  stripe_payment_intent_id text,
  deposit_paid numeric(10, 2) not null default 0,
  total_paid numeric(10, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings (id) on delete cascade,
  stripe_payment_intent_id text not null,
  amount numeric(10, 2) not null,
  type text not null check (type in ('deposit', 'full', 'remainder')),
  status text not null default 'pending'
    check (status in ('pending', 'succeeded', 'failed', 'refunded')),
  created_at timestamptz not null default now()
);

create index if not exists bookings_date_idx on bookings (appointment_date);
create index if not exists bookings_stylist_idx on bookings (stylist_id);

-- Backstop for the API's check-then-insert: two simultaneous requests can
-- both pass the availability re-check, so the database must reject the
-- loser. Cancelled/completed bookings don't hold the slot.
create unique index if not exists bookings_slot_unique_idx
  on bookings (stylist_id, appointment_date, appointment_time)
  where status in ('pending', 'confirmed');
create index if not exists availability_stylist_idx on availability (stylist_id);

-- Row Level Security: public site reads active/public rows anonymously;
-- writes go through authenticated admin or server-side service role.
alter table services enable row level security;
alter table stylists enable row level security;
alter table availability enable row level security;
alter table blocked_dates enable row level security;
alter table business_hours enable row level security;
alter table bookings enable row level security;
alter table payments enable row level security;

create policy "public read active services" on services
  for select using (active);
create policy "public read active stylists" on stylists
  for select using (active);
create policy "public read availability" on availability
  for select using (active);
create policy "public read blocked dates" on blocked_dates
  for select using (true);
create policy "public read business hours" on business_hours
  for select using (true);

create policy "admin full access services" on services
  for all using (auth.role() = 'authenticated');
create policy "admin full access stylists" on stylists
  for all using (auth.role() = 'authenticated');
create policy "admin full access availability" on availability
  for all using (auth.role() = 'authenticated');
create policy "admin full access blocked_dates" on blocked_dates
  for all using (auth.role() = 'authenticated');
create policy "admin full access business_hours" on business_hours
  for all using (auth.role() = 'authenticated');
create policy "admin read bookings" on bookings
  for select using (auth.role() = 'authenticated');
create policy "admin update bookings" on bookings
  for update using (auth.role() = 'authenticated');
create policy "admin read payments" on payments
  for select using (auth.role() = 'authenticated');
