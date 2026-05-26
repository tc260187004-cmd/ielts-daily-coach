create table if not exists public.vocabulary_review_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word text not null,
  meaning_cn text,
  status text,
  review_count integer not null default 0,
  correct_streak integer not null default 0,
  wrong_count integer not null default 0,
  last_reviewed_at timestamptz,
  next_review_date date,
  mastered boolean not null default false,
  in_wrongbook boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, word)
);

create table if not exists public.vocabulary_test_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  test_date date not null,
  total_questions integer not null,
  correct_count integer not null,
  accuracy numeric not null,
  wrong_words jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.vocabulary_test_items (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.vocabulary_test_logs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_type text not null,
  word text not null,
  question text not null,
  options jsonb not null,
  correct_answer text not null,
  user_answer text,
  is_correct boolean not null default false,
  created_at timestamptz not null default now()
);

drop trigger if exists set_vocabulary_review_states_updated_at on public.vocabulary_review_states;
create trigger set_vocabulary_review_states_updated_at
before update on public.vocabulary_review_states
for each row execute function public.set_updated_at();

alter table public.vocabulary_review_states enable row level security;
alter table public.vocabulary_test_logs enable row level security;
alter table public.vocabulary_test_items enable row level security;

create policy "vocabulary_review_states select own" on public.vocabulary_review_states for select using (auth.uid() = user_id);
create policy "vocabulary_review_states insert own" on public.vocabulary_review_states for insert with check (auth.uid() = user_id);
create policy "vocabulary_review_states update own" on public.vocabulary_review_states for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "vocabulary_review_states delete own" on public.vocabulary_review_states for delete using (auth.uid() = user_id);

create policy "vocabulary_test_logs select own" on public.vocabulary_test_logs for select using (auth.uid() = user_id);
create policy "vocabulary_test_logs insert own" on public.vocabulary_test_logs for insert with check (auth.uid() = user_id);
create policy "vocabulary_test_logs update own" on public.vocabulary_test_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "vocabulary_test_logs delete own" on public.vocabulary_test_logs for delete using (auth.uid() = user_id);

create policy "vocabulary_test_items select own" on public.vocabulary_test_items for select using (auth.uid() = user_id);
create policy "vocabulary_test_items insert own" on public.vocabulary_test_items for insert with check (auth.uid() = user_id);
create policy "vocabulary_test_items update own" on public.vocabulary_test_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "vocabulary_test_items delete own" on public.vocabulary_test_items for delete using (auth.uid() = user_id);

create index if not exists vocabulary_review_states_due_idx on public.vocabulary_review_states(user_id, next_review_date, mastered);
create index if not exists vocabulary_review_states_wrongbook_idx on public.vocabulary_review_states(user_id, in_wrongbook);
create index if not exists vocabulary_test_logs_user_date_idx on public.vocabulary_test_logs(user_id, test_date desc);
create index if not exists vocabulary_test_items_test_idx on public.vocabulary_test_items(test_id);
