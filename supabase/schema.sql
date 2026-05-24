create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  account_id uuid,
  username text unique,
  company_name text not null,
  brand_name text,
  logo_url text,
  foreground text default '#111827',
  background text default '#ffffff',
  sample_url text default 'https://scanops.io',
  plan text default 'free',
  created_at timestamptz default now()
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  plan text default 'free',
  suspended_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles
  add column if not exists account_id uuid,
  add column if not exists username text unique;

alter table public.accounts
  add column if not exists suspended_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_account_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_account_id_fkey
      foreign key (account_id) references public.accounts(id) on delete set null
      not valid;
  end if;
end;
$$;

do $$
begin
  alter table public.profiles validate constraint profiles_account_id_fkey;
exception when others then
  null;
end;
$$;

create table if not exists public.account_members (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz default now(),
  unique(account_id, user_id)
);

create table if not exists public.qr_folders (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  name text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.qr_campaigns (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  folder_id uuid references public.qr_folders(id) on delete set null,
  name text not null,
  category text,
  status text default 'active',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete cascade,
  folder_id uuid references public.qr_folders(id) on delete set null,
  campaign_id uuid references public.qr_campaigns(id) on delete set null,
  name text not null,
  type text not null default 'url',
  destination_url text not null,
  payload text not null,
  short_code text unique,
  is_dynamic boolean default true,
  status text default 'active',
  expires_at timestamptz,
  tags text[] default '{}'::text[],
  foreground text default '#111827',
  background text default '#ffffff',
  logo_url text,
  style_config jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.qr_codes
  add column if not exists style_config jsonb default '{}'::jsonb,
  add column if not exists status text default 'active',
  add column if not exists expires_at timestamptz,
  add column if not exists tags text[] default '{}'::text[],
  add column if not exists account_id uuid references public.accounts(id) on delete cascade,
  add column if not exists folder_id uuid references public.qr_folders(id) on delete set null,
  add column if not exists campaign_id uuid references public.qr_campaigns(id) on delete set null;

create table if not exists public.qr_scans (
  id bigint generated always as identity primary key,
  qr_code_id uuid not null references public.qr_codes(id) on delete cascade,
  scanned_at timestamptz default now(),
  user_agent text,
  ip_address text
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  plan text not null default 'starter',
  billing_term text not null default 'monthly',
  status text not null default 'trialing',
  trial_ends_at timestamptz,
  current_period_ends_at timestamptz,
  cancel_at_period_end boolean default false,
  canceled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  qr_code_id uuid references public.qr_codes(id) on delete set null,
  requester_name text,
  requester_email text,
  subject text not null,
  message text not null,
  status text default 'open',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  account_id uuid references public.accounts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  name text not null,
  key_hash text not null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.subscriptions
  add column if not exists cancel_at_period_end boolean default false,
  add column if not exists canceled_at timestamptz;

create index if not exists qr_codes_user_id_idx on public.qr_codes(user_id);
create index if not exists qr_codes_account_id_idx on public.qr_codes(account_id);
create index if not exists qr_codes_folder_id_idx on public.qr_codes(folder_id);
create index if not exists qr_codes_campaign_id_idx on public.qr_codes(campaign_id);
create index if not exists qr_codes_short_code_idx on public.qr_codes(short_code);
create index if not exists qr_scans_code_time_idx on public.qr_scans(qr_code_id, scanned_at desc);
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists account_members_account_id_idx on public.account_members(account_id);
create index if not exists account_members_user_id_idx on public.account_members(user_id);
create index if not exists qr_folders_account_id_idx on public.qr_folders(account_id);
create index if not exists qr_campaigns_account_id_idx on public.qr_campaigns(account_id);
create index if not exists support_tickets_account_id_idx on public.support_tickets(account_id);
create index if not exists audit_logs_account_id_idx on public.audit_logs(account_id);
create index if not exists api_keys_account_id_idx on public.api_keys(account_id);

create or replace function public.is_account_member(target_account_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.account_members
    where account_members.account_id = target_account_id
      and account_members.user_id = auth.uid()
  );
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.raw_user_meta_data->>'invited_account_id' is null then
    insert into public.accounts (
      owner_user_id,
      company_name,
      plan
    )
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'company_name', split_part(new.email, '@', 1), 'Customer'),
      'free'
    );
  end if;

  insert into public.profiles (
    id,
    account_id,
    username,
    company_name,
    brand_name,
    logo_url,
    foreground,
    background,
    plan
  )
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'invited_account_id', '')::uuid,
      (select accounts.id from public.accounts where accounts.owner_user_id = new.id order by accounts.created_at desc limit 1)
    ),
    lower(coalesce(nullif(new.raw_user_meta_data->>'username', ''), split_part(new.email, '@', 1))) || '-' || substr(new.id::text, 1, 4),
    coalesce(new.raw_user_meta_data->>'company_name', split_part(new.email, '@', 1), 'Customer'),
    coalesce(new.raw_user_meta_data->>'company_name', split_part(new.email, '@', 1), 'Customer'),
    null,
    '#111827',
    '#ffffff',
    'free'
  )
  on conflict (id) do nothing;

  insert into public.account_members (
    account_id,
    user_id,
    role
  )
  values (
    coalesce(
      nullif(new.raw_user_meta_data->>'invited_account_id', '')::uuid,
      (select accounts.id from public.accounts where accounts.owner_user_id = new.id order by accounts.created_at desc limit 1)
    ),
    new.id,
    coalesce(new.raw_user_meta_data->>'invited_role', 'owner')
  )
  on conflict (account_id, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

insert into public.accounts (owner_user_id, company_name, plan)
select
  users.id,
  coalesce(users.raw_user_meta_data->>'company_name', split_part(users.email, '@', 1), 'Customer'),
  coalesce(profiles.plan, 'free')
from auth.users
left join public.profiles on profiles.id = users.id
left join public.accounts on accounts.owner_user_id = users.id
where accounts.id is null;

insert into public.profiles (
  id,
  account_id,
  username,
  company_name,
  brand_name,
  logo_url,
  foreground,
  background,
  plan
)
select
  users.id,
  accounts.id,
  lower(coalesce(nullif(users.raw_user_meta_data->>'username', ''), split_part(users.email, '@', 1))) || '-' || substr(users.id::text, 1, 4),
  coalesce(users.raw_user_meta_data->>'company_name', split_part(users.email, '@', 1), 'Customer'),
  coalesce(users.raw_user_meta_data->>'company_name', split_part(users.email, '@', 1), 'Customer'),
  null,
  '#111827',
  '#ffffff',
  coalesce(accounts.plan, 'free')
from auth.users
join public.accounts on accounts.owner_user_id = users.id
left join public.profiles on profiles.id = users.id
where profiles.id is null;

update public.profiles
set account_id = accounts.id
from public.accounts
where profiles.account_id is null
  and accounts.owner_user_id = profiles.id;

update public.profiles
set username = lower(regexp_replace(coalesce(username, split_part(auth_users.email, '@', 1)), '[^a-zA-Z0-9_.-]', '', 'g')) || '-' || substr(profiles.id::text, 1, 4)
from auth.users auth_users
where profiles.id = auth_users.id
  and profiles.username is null;

insert into public.account_members (account_id, user_id, role)
select profiles.account_id, profiles.id, 'owner'
from public.profiles
where profiles.account_id is not null
on conflict (account_id, user_id) do nothing;

update public.qr_codes
set account_id = profiles.account_id
from public.profiles
where qr_codes.account_id is null
  and qr_codes.user_id = profiles.id;

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.account_members enable row level security;
alter table public.qr_folders enable row level security;
alter table public.qr_campaigns enable row level security;
alter table public.qr_codes enable row level security;
alter table public.qr_scans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.support_tickets enable row level security;
alter table public.audit_logs enable row level security;
alter table public.api_keys enable row level security;

drop policy if exists "Profiles are owner readable" on public.profiles;
create policy "Profiles are owner readable"
  on public.profiles for select
  using (auth.uid() = id or public.is_account_member(account_id));

drop policy if exists "Profiles are owner writable" on public.profiles;
create policy "Profiles are owner writable"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Profiles are owner updateable" on public.profiles;
create policy "Profiles are owner updateable"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Accounts are member readable" on public.accounts;
create policy "Accounts are member readable"
  on public.accounts for select
  using (public.is_account_member(id));

drop policy if exists "Accounts are owner updateable" on public.accounts;
create policy "Accounts are owner updateable"
  on public.accounts for update
  using (owner_user_id = auth.uid());

drop policy if exists "Account members are member readable" on public.account_members;
create policy "Account members are member readable"
  on public.account_members for select
  using (public.is_account_member(account_id));

drop policy if exists "QR codes are owner readable" on public.qr_codes;
create policy "QR codes are owner readable"
  on public.qr_codes for select
  using (auth.uid() = user_id or public.is_account_member(account_id));

drop policy if exists "QR folders are member readable" on public.qr_folders;
create policy "QR folders are member readable"
  on public.qr_folders for select
  using (public.is_account_member(account_id));

drop policy if exists "QR folders are member writable" on public.qr_folders;
create policy "QR folders are member writable"
  on public.qr_folders for insert
  with check (public.is_account_member(account_id));

drop policy if exists "QR campaigns are member readable" on public.qr_campaigns;
create policy "QR campaigns are member readable"
  on public.qr_campaigns for select
  using (public.is_account_member(account_id));

drop policy if exists "QR campaigns are member writable" on public.qr_campaigns;
create policy "QR campaigns are member writable"
  on public.qr_campaigns for insert
  with check (public.is_account_member(account_id));

drop policy if exists "QR codes are owner writable" on public.qr_codes;
create policy "QR codes are owner writable"
  on public.qr_codes for insert
  with check (auth.uid() = user_id and public.is_account_member(account_id));

drop policy if exists "QR codes are owner updateable" on public.qr_codes;
create policy "QR codes are owner updateable"
  on public.qr_codes for update
  using (auth.uid() = user_id or public.is_account_member(account_id));

drop policy if exists "QR scans are owner readable" on public.qr_scans;
create policy "QR scans are owner readable"
  on public.qr_scans for select
  using (
    exists (
      select 1 from public.qr_codes
      where qr_codes.id = qr_scans.qr_code_id
      and (qr_codes.user_id = auth.uid() or public.is_account_member(qr_codes.account_id))
    )
  );

drop policy if exists "Subscriptions are owner readable" on public.subscriptions;
create policy "Subscriptions are owner readable"
  on public.subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "Support tickets are account readable" on public.support_tickets;
create policy "Support tickets are account readable"
  on public.support_tickets for select
  using (public.is_account_member(account_id));

drop policy if exists "Support tickets are account writable" on public.support_tickets;
create policy "Support tickets are account writable"
  on public.support_tickets for insert
  with check (public.is_account_member(account_id));

drop policy if exists "Audit logs are account readable" on public.audit_logs;
create policy "Audit logs are account readable"
  on public.audit_logs for select
  using (public.is_account_member(account_id));

drop policy if exists "API keys are account readable" on public.api_keys;
create policy "API keys are account readable"
  on public.api_keys for select
  using (public.is_account_member(account_id));
