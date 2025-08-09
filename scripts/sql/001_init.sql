-- Schema initialization for PayPass Scan and Go (idempotent)

-- Extensions
create extension if not exists "pgcrypto";

-- Users
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null unique,
  email text,
  pin_hash text not null,
  biometric_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Operators (bus/taxi companies)
create table if not exists operators (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  phone text not null unique,
  email text,
  pin_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Wallets (dual-currency)
create table if not exists wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  usd_balance numeric(18,2) not null default 0.00,
  zwl_balance numeric(18,2) not null default 0.00,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Routes (for QR payments)
create table if not exists routes (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references operators(id) on delete cascade,
  name text not null,
  description text,
  fare_usd numeric(10,2) not null,
  fare_zwl numeric(12,2) not null,
  qr_code text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Transactions
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  operator_id uuid references operators(id) on delete set null,
  route_id uuid references routes(id) on delete set null,
  type text not null check (type in ('payment','topup','send','receive')),
  category text not null check (category in ('bus','shop','utility','transfer')),
  amount numeric(18,2) not null check (amount >= 0),
  currency text not null check (currency in ('USD','ZWL')),
  description text not null,
  status text not null check (status in ('pending','completed','failed')),
  payment_method text,
  reference text,
  created_at timestamptz not null default now()
);

-- Unique seed helper
create unique index if not exists uniq_transactions_reference
  on transactions(reference)
  where reference is not null;

-- Indexes
create index if not exists idx_users_phone on users(phone);
create index if not exists idx_operators_phone on operators(phone);
create index if not exists idx_transactions_user on transactions(user_id, created_at desc);
create index if not exists idx_transactions_operator on transactions(operator_id, created_at desc);
create index if not exists idx_routes_operator on routes(operator_id);

-- updated_at trigger function
do $$
begin
  if not exists (
    select 1 from pg_proc where proname = 'set_updated_at'
  ) then
    create or replace function set_updated_at() returns trigger as $func$
    begin
      new.updated_at := now();
      return new;
    end
    $func$ language plpgsql;
  end if;
end
$$;

-- Attach triggers
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_users_updated_at') then
    create trigger trg_users_updated_at
      before update on users
      for each row execute function set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_operators_updated_at') then
    create trigger trg_operators_updated_at
      before update on operators
      for each row execute function set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_wallets_updated_at') then
    create trigger trg_wallets_updated_at
      before update on wallets
      for each row execute function set_updated_at();
  end if;
end
$$;
