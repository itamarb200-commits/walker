-- ─── Walker — multi-family pet-care duty tracker ──────────────────────────────
-- Run in the Supabase SQL editor (Phase 1). Every row is scoped to a family;
-- RLS guarantees a signed-in user only ever sees their own family's data.

-- Families ────────────────────────────────────────────────────────────────────
create table families (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  invite_code text not null unique default substr(md5(random()::text), 1, 8),
  timezone    text not null default 'Asia/Jerusalem',
  locale      text not null default 'he',
  created_at  timestamptz not null default now()
);

-- Family members (persons) — NOT the same as auth users. A person can exist
-- without an account (e.g. a kid without a phone); an auth user links to one.
create table persons (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references families(id) on delete cascade,
  name       text not null,
  color_idx  int  not null default 1,          -- --pal-N palette index (1..8)
  user_id    uuid references auth.users(id),   -- optional account link
  created_at timestamptz not null default now()
);
create index persons_family_idx on persons(family_id);
create unique index persons_user_idx on persons(user_id) where user_id is not null;

-- Pets ────────────────────────────────────────────────────────────────────────
create table pets (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references families(id) on delete cascade,
  name       text not null,
  species    text not null default 'dog',      -- dog | cat | other
  photo_url  text,
  created_at timestamptz not null default now()
);
create index pets_family_idx on pets(family_id);

-- Recurring care tasks (generalized "walks"/"feedings") ───────────────────────
create table tasks (
  id             uuid primary key default gen_random_uuid(),
  family_id      uuid not null references families(id) on delete cascade,
  pet_id         uuid references pets(id) on delete cascade,
  label          text not null,                -- "טיול בוקר" / "Morning walk"
  icon           text not null default 'paw',  -- lucide icon key
  times          text[] not null default '{}', -- ["08:00","16:00"] family-local
  eligible_ids   uuid[] not null default '{}', -- persons in the rotation
  track_fairness boolean not null default true,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now()
);
create index tasks_family_idx on tasks(family_id);

-- One row per completed occurrence ────────────────────────────────────────────
create table task_logs (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references families(id) on delete cascade,
  task_id    uuid not null references tasks(id) on delete cascade,
  person_id  uuid not null references persons(id) on delete cascade,
  local_date date not null,                    -- family-local calendar day
  slot_time  text,                             -- which of the task's times (nullable)
  is_help    boolean not null default false,   -- helper credit, outside fairness
  created_at timestamptz not null default now()
);
create index task_logs_family_date_idx on task_logs(family_id, local_date);
-- One primary (non-help) entry per task+time+day; helpers are unlimited.
create unique index task_logs_primary_idx
  on task_logs(task_id, local_date, coalesce(slot_time, ''))
  where is_help = false;

-- Push subscriptions + per-user notification prefs ────────────────────────────
create table push_subs (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references families(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null unique,
  sub_json   jsonb not null,
  created_at timestamptz not null default now()
);
create index push_subs_family_idx on push_subs(family_id);

create table notif_prefs (
  user_id     uuid not null references auth.users(id) on delete cascade,
  task_id     uuid not null references tasks(id) on delete cascade,
  enabled     boolean not null default true,
  primary key (user_id, task_id)
);

-- Reminder dedup (one send per task+time per family-local day) ────────────────
create table reminders_sent (
  task_id    uuid not null references tasks(id) on delete cascade,
  slot_time  text not null,
  local_date date not null,
  primary key (task_id, slot_time, local_date)
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- Helper: the family the signed-in user belongs to.
create or replace function my_family_id() returns uuid
language sql stable security definer set search_path = public as $$
  select family_id from persons where user_id = auth.uid() limit 1;
$$;

alter table families      enable row level security;
alter table persons       enable row level security;
alter table pets          enable row level security;
alter table tasks         enable row level security;
alter table task_logs     enable row level security;
alter table push_subs     enable row level security;
alter table notif_prefs   enable row level security;
alter table reminders_sent enable row level security;

create policy family_select on families for select using (id = my_family_id());
create policy family_update on families for update using (id = my_family_id());
-- insert happens through the create-family RPC below.

create policy persons_all   on persons   for all using (family_id = my_family_id());
create policy pets_all      on pets      for all using (family_id = my_family_id());
create policy tasks_all     on tasks     for all using (family_id = my_family_id());
create policy task_logs_all on task_logs for all using (family_id = my_family_id());
create policy push_subs_all on push_subs for all using (user_id = auth.uid());
create policy notif_prefs_all on notif_prefs for all using (user_id = auth.uid());
-- reminders_sent is server-only (service role bypasses RLS); no user policies.

-- ─── RPCs (security definer — the only doors around RLS) ─────────────────────

-- Create a family + the creator's own person row, atomically.
create or replace function create_family(family_name text, person_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare fid uuid;
begin
  if my_family_id() is not null then
    raise exception 'already in a family';
  end if;
  insert into families(name) values (family_name) returning id into fid;
  insert into persons(family_id, name, color_idx, user_id)
    values (fid, person_name, 1, auth.uid());
  return fid;
end $$;

-- Join by invite code: either claim an existing unlinked person or create one.
create or replace function join_family(code text, person_name text, claim_person uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare fid uuid; cnt int;
begin
  if my_family_id() is not null then
    raise exception 'already in a family';
  end if;
  select id into fid from families where invite_code = code;
  if fid is null then
    raise exception 'invalid invite code';
  end if;
  if claim_person is not null then
    update persons set user_id = auth.uid()
      where id = claim_person and family_id = fid and user_id is null;
    if not found then raise exception 'person not claimable'; end if;
  else
    select count(*) into cnt from persons where family_id = fid;
    insert into persons(family_id, name, color_idx, user_id)
      values (fid, person_name, (cnt % 8) + 1, auth.uid());
  end if;
  return fid;
end $$;

-- Public peek at a family by invite code (name + unclaimed persons) so the
-- join screen can show "who are you?" before the user commits.
create or replace function peek_family(code text)
returns table(family_name text, person_id uuid, person_name text)
language sql stable security definer set search_path = public as $$
  select f.name, p.id, p.name
  from families f
  left join persons p on p.family_id = f.id and p.user_id is null
  where f.invite_code = code;
$$;
