create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  target_band text not null default '6.5',
  daily_minutes integer not null default 60 check (daily_minutes in (30, 60, 90, 120)),
  weak_area text,
  exam_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  planned_minutes integer not null,
  actual_minutes integer not null default 0,
  completion_rate numeric not null default 0,
  completed_tasks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, log_date)
);

create table if not exists public.listening_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  listening_id text not null,
  new_words text,
  summary_en text,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  unique(user_id, log_date)
);

create table if not exists public.vocabulary_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  word text not null,
  status text not null check (status in ('mastered', 'unfamiliar', 'wrongbook')),
  created_at timestamptz not null default now(),
  unique(user_id, log_date, word)
);

create table if not exists public.speaking_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  part text not null,
  question text not null,
  answer text not null,
  ai_feedback jsonb,
  estimated_band_range text,
  created_at timestamptz not null default now()
);

create table if not exists public.writing_reading_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  type text not null check (type in ('reading', 'writing')),
  prompt text not null,
  user_notes text,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  unique(user_id, log_date, type)
);

create table if not exists public.daily_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  summary jsonb not null,
  created_at timestamptz not null default now(),
  unique(user_id, log_date)
);

create table if not exists public.stage_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stage_type text not null check (stage_type in ('weekly', 'day30', 'day60')),
  start_date date not null,
  end_date date not null,
  review jsonb not null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_daily_logs_updated_at on public.daily_logs;
create trigger set_daily_logs_updated_at
before update on public.daily_logs
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.daily_logs enable row level security;
alter table public.listening_logs enable row level security;
alter table public.vocabulary_logs enable row level security;
alter table public.speaking_logs enable row level security;
alter table public.writing_reading_logs enable row level security;
alter table public.daily_summaries enable row level security;
alter table public.stage_reviews enable row level security;

create policy "profiles select own" on public.profiles for select using (auth.uid() = id);
create policy "profiles insert own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles update own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles delete own" on public.profiles for delete using (auth.uid() = id);

create policy "daily_logs select own" on public.daily_logs for select using (auth.uid() = user_id);
create policy "daily_logs insert own" on public.daily_logs for insert with check (auth.uid() = user_id);
create policy "daily_logs update own" on public.daily_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "daily_logs delete own" on public.daily_logs for delete using (auth.uid() = user_id);

create policy "listening_logs select own" on public.listening_logs for select using (auth.uid() = user_id);
create policy "listening_logs insert own" on public.listening_logs for insert with check (auth.uid() = user_id);
create policy "listening_logs update own" on public.listening_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "listening_logs delete own" on public.listening_logs for delete using (auth.uid() = user_id);

create policy "vocabulary_logs select own" on public.vocabulary_logs for select using (auth.uid() = user_id);
create policy "vocabulary_logs insert own" on public.vocabulary_logs for insert with check (auth.uid() = user_id);
create policy "vocabulary_logs update own" on public.vocabulary_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "vocabulary_logs delete own" on public.vocabulary_logs for delete using (auth.uid() = user_id);

create policy "speaking_logs select own" on public.speaking_logs for select using (auth.uid() = user_id);
create policy "speaking_logs insert own" on public.speaking_logs for insert with check (auth.uid() = user_id);
create policy "speaking_logs update own" on public.speaking_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "speaking_logs delete own" on public.speaking_logs for delete using (auth.uid() = user_id);

create policy "writing_reading_logs select own" on public.writing_reading_logs for select using (auth.uid() = user_id);
create policy "writing_reading_logs insert own" on public.writing_reading_logs for insert with check (auth.uid() = user_id);
create policy "writing_reading_logs update own" on public.writing_reading_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "writing_reading_logs delete own" on public.writing_reading_logs for delete using (auth.uid() = user_id);

create policy "daily_summaries select own" on public.daily_summaries for select using (auth.uid() = user_id);
create policy "daily_summaries insert own" on public.daily_summaries for insert with check (auth.uid() = user_id);
create policy "daily_summaries update own" on public.daily_summaries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "daily_summaries delete own" on public.daily_summaries for delete using (auth.uid() = user_id);

create policy "stage_reviews select own" on public.stage_reviews for select using (auth.uid() = user_id);
create policy "stage_reviews insert own" on public.stage_reviews for insert with check (auth.uid() = user_id);
create policy "stage_reviews update own" on public.stage_reviews for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "stage_reviews delete own" on public.stage_reviews for delete using (auth.uid() = user_id);

create index if not exists daily_logs_user_date_idx on public.daily_logs(user_id, log_date desc);
create index if not exists listening_logs_user_date_idx on public.listening_logs(user_id, log_date desc);
create index if not exists vocabulary_logs_user_date_idx on public.vocabulary_logs(user_id, log_date desc);
create index if not exists speaking_logs_user_date_idx on public.speaking_logs(user_id, log_date desc);
create index if not exists writing_reading_logs_user_date_idx on public.writing_reading_logs(user_id, log_date desc);
