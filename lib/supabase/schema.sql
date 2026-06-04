-- =============================================================
-- FitTrack Pro - Supabase schema
-- Pegar este SQL completo en: Supabase Dashboard > SQL Editor > New query
-- =============================================================

-- ---- 1. PROFILES ----------------------------------------------
-- Una fila por usuario. Se crea automáticamente al registrarse (ver trigger abajo)
create table if not exists public.profiles (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  name               text,
  age                integer,
  weight             numeric,
  height             numeric,
  gender             text check (gender in ('male','female')),
  goal               text check (goal in ('cut','maintain','bulk')),
  activity_level     text,
  tdee               integer default 0,
  protein            integer default 0,
  carbs              integer default 0,
  fat                integer default 0,
  -- Onboarding completo?
  onboarded          boolean default false,
  -- Stripe / Plan
  plan               text default 'free' check (plan in ('free','pro')),
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_subscription_status text,
  current_period_end timestamptz,
  -- Contadores de uso (resetean por mes)
  scan_count         integer default 0,
  scan_count_month   text default to_char(now(),'YYYY-MM'),
  ai_message_count   integer default 0,
  ai_message_count_month text default to_char(now(),'YYYY-MM'),
  active_routine_id  text,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

-- ---- 2. WORKOUT LOGS ------------------------------------------
create table if not exists public.workout_logs (
  id           text primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  exercise_id  text not null,
  date         date not null,
  sets         jsonb not null default '[]'::jsonb,
  created_at   timestamptz default now()
);
create index if not exists workout_logs_user_idx on public.workout_logs(user_id);
create index if not exists workout_logs_date_idx on public.workout_logs(user_id, date);

-- ---- 3. CUSTOM EXERCISES --------------------------------------
create table if not exists public.custom_exercises (
  id                text primary key,
  user_id           uuid not null references auth.users(id) on delete cascade,
  name              text not null,
  muscle_group      text not null,
  video_placeholder text,
  created_at        timestamptz default now()
);
create index if not exists custom_exercises_user_idx on public.custom_exercises(user_id);

-- ---- 4. ROUTINES ----------------------------------------------
create table if not exists public.routines (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  days        jsonb not null default '[]'::jsonb,
  is_template boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index if not exists routines_user_idx on public.routines(user_id);

-- ---- 5. FOOD ENTRIES ------------------------------------------
create table if not exists public.food_entries (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  calories    integer default 0,
  protein     integer default 0,
  carbs       integer default 0,
  fat         integer default 0,
  date        date not null,
  created_at  timestamptz default now()
);
create index if not exists food_entries_user_idx on public.food_entries(user_id);
create index if not exists food_entries_date_idx on public.food_entries(user_id, date);

-- ---- 6. CHAT MESSAGES -----------------------------------------
create table if not exists public.chat_messages (
  id         text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('user','assistant')),
  content    text not null,
  timestamp  timestamptz not null default now(),
  created_at timestamptz default now()
);
create index if not exists chat_messages_user_idx on public.chat_messages(user_id, timestamp);

-- =============================================================
-- ROW LEVEL SECURITY: cada usuario ve y modifica solo lo suyo
-- =============================================================
alter table public.profiles         enable row level security;
alter table public.workout_logs     enable row level security;
alter table public.custom_exercises enable row level security;
alter table public.routines         enable row level security;
alter table public.food_entries     enable row level security;
alter table public.chat_messages    enable row level security;

-- Profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = user_id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id);

-- Helper macro: políticas idénticas para tablas que tienen user_id
do $$
declare t text;
begin
  for t in select unnest(array[
    'workout_logs','custom_exercises','routines','food_entries','chat_messages'
  ]) loop
    execute format('drop policy if exists "%1$s_select_own" on public.%1$s;', t);
    execute format('create policy "%1$s_select_own" on public.%1$s for select using (auth.uid() = user_id);', t);
    execute format('drop policy if exists "%1$s_insert_own" on public.%1$s;', t);
    execute format('create policy "%1$s_insert_own" on public.%1$s for insert with check (auth.uid() = user_id);', t);
    execute format('drop policy if exists "%1$s_update_own" on public.%1$s;', t);
    execute format('create policy "%1$s_update_own" on public.%1$s for update using (auth.uid() = user_id);', t);
    execute format('drop policy if exists "%1$s_delete_own" on public.%1$s;', t);
    execute format('create policy "%1$s_delete_own" on public.%1$s for delete using (auth.uid() = user_id);', t);
  end loop;
end$$;

-- =============================================================
-- TRIGGER: crear fila en profiles automáticamente al registrarse
-- =============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', null))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================
-- HELPERS PARA LÍMITES DE USO
-- =============================================================
-- Incrementa scan_count, reseteando si cambió de mes. Devuelve el nuevo conteo.
create or replace function public.increment_scan_count(p_user_id uuid)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  current_month text := to_char(now(),'YYYY-MM');
  new_count integer;
begin
  update public.profiles
     set scan_count = case
                        when scan_count_month = current_month then scan_count + 1
                        else 1
                      end,
         scan_count_month = current_month,
         updated_at = now()
   where user_id = p_user_id
   returning scan_count into new_count;
  return new_count;
end;
$$;

create or replace function public.increment_ai_message_count(p_user_id uuid)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  current_month text := to_char(now(),'YYYY-MM');
  new_count integer;
begin
  update public.profiles
     set ai_message_count = case
                              when ai_message_count_month = current_month then ai_message_count + 1
                              else 1
                            end,
         ai_message_count_month = current_month,
         updated_at = now()
   where user_id = p_user_id
   returning ai_message_count into new_count;
  return new_count;
end;
$$;
