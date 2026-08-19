-- ============================================================
-- Berean AG — Initial schema
-- Run this in the Supabase Dashboard → SQL Editor (or via
-- `supabase db push` if you use the Supabase CLI).
-- ============================================================

-- ------------------------------------------------------------
-- Profiles (one row per auth user)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create a profile automatically when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'display_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keep updated_at current on updates
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- Notes
-- ------------------------------------------------------------
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  content text,
  category text not null default 'general',
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_user_id_idx on public.notes (user_id);

create trigger notes_set_updated_at
  before update on public.notes
  for each row execute procedure public.set_updated_at();

-- ------------------------------------------------------------
-- Journal entries
-- ------------------------------------------------------------
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text,
  content text not null,
  mood text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists journal_entries_user_id_idx on public.journal_entries (user_id);

create trigger journal_entries_set_updated_at
  before update on public.journal_entries
  for each row execute procedure public.set_updated_at();

-- ------------------------------------------------------------
-- Chats & messages
-- ------------------------------------------------------------
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  name text,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_members (
  chat_id uuid not null references public.chats (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (chat_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_chat_id_idx on public.messages (chat_id);

-- ------------------------------------------------------------
-- Events
-- ------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists events_starts_at_idx on public.events (starts_at);

-- ------------------------------------------------------------
-- Settings (app-wide key/value)
-- ------------------------------------------------------------
create table if not exists public.settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.notes enable row level security;
alter table public.journal_entries enable row level security;
alter table public.chats enable row level security;
alter table public.chat_members enable row level security;
alter table public.messages enable row level security;
alter table public.events enable row level security;
alter table public.settings enable row level security;

-- Profiles: viewable by everyone, editable by the owner
create policy "profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Notes: fully owned by the user
create policy "users can view their own notes"
  on public.notes for select using (auth.uid() = user_id);

create policy "users can create their own notes"
  on public.notes for insert with check (auth.uid() = user_id);

create policy "users can update their own notes"
  on public.notes for update using (auth.uid() = user_id);

create policy "users can delete their own notes"
  on public.notes for delete using (auth.uid() = user_id);

-- Journal entries: fully owned by the user
create policy "users can view their own journal entries"
  on public.journal_entries for select using (auth.uid() = user_id);

create policy "users can create their own journal entries"
  on public.journal_entries for insert with check (auth.uid() = user_id);

create policy "users can update their own journal entries"
  on public.journal_entries for update using (auth.uid() = user_id);

create policy "users can delete their own journal entries"
  on public.journal_entries for delete using (auth.uid() = user_id);

-- Chats: members only
create policy "chat members can view their chats"
  on public.chats for select using (
    exists (
      select 1 from public.chat_members
      where chat_id = chats.id and user_id = auth.uid()
    )
  );

create policy "authenticated users can create chats"
  on public.chats for insert with check (auth.role() = 'authenticated');

create policy "chat members can view members"
  on public.chat_members for select using (
    exists (
      select 1 from public.chat_members
      where chat_id = chat_members.chat_id and user_id = auth.uid()
    )
  );

create policy "chat members can join chats"
  on public.chat_members for insert with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.chats
      where id = chat_id
    )
  );

-- Messages: members only
create policy "chat members can view messages"
  on public.messages for select using (
    exists (
      select 1 from public.chat_members
      where chat_id = messages.chat_id and user_id = auth.uid()
    )
  );

create policy "chat members can send messages"
  on public.messages for insert with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.chat_members
      where chat_id = messages.chat_id and user_id = auth.uid()
    )
  );

-- Events: public read, authenticated create
create policy "events are viewable by everyone"
  on public.events for select using (true);

create policy "authenticated users can create events"
  on public.events for insert with check (auth.role() = 'authenticated');

-- Settings: public read, authenticated write
create policy "settings are viewable by everyone"
  on public.settings for select using (true);

create policy "authenticated users can update settings"
  on public.settings for all with check (auth.role() = 'authenticated');

-- ============================================================
-- Seed data (sample events so the app has content)
-- ============================================================
insert into public.events (title, location, starts_at)
select 'Sunday Worship Service', 'Main Sanctuary', now() + interval '3 days'
where not exists (select 1 from public.events where title = 'Sunday Worship Service');

insert into public.events (title, location, starts_at)
select 'Midweek Bible Study', 'Fellowship Hall', now() + interval '6 days'
where not exists (select 1 from public.events where title = 'Midweek Bible Study');
