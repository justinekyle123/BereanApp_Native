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
  is_admin boolean not null default false,
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
-- Announcements (the home feed)
-- ------------------------------------------------------------
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  author text not null,
  avatar_color text not null default '#0d9488',
  title text,
  body text not null,
  category text not null default 'Announcements',
  banner jsonb,
  image_url text,
  likes integer not null default 0,
  comments integer not null default 0,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists announcements_published_at_idx
  on public.announcements (published_at desc);

create trigger announcements_set_updated_at
  before update on public.announcements
  for each row execute procedure public.set_updated_at();

-- ------------------------------------------------------------
-- Announcement likes & comments
-- ------------------------------------------------------------
create table if not exists public.announcement_likes (
  announcement_id uuid not null references public.announcements (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (announcement_id, user_id)
);

create table if not exists public.announcement_comments (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists announcement_comments_announcement_id_idx
  on public.announcement_comments (announcement_id);

-- Keep announcements.likes / comments counters in sync
create or replace function public.sync_announcement_likes_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.announcements set likes = likes + 1 where id = new.announcement_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.announcements set likes = greatest(likes - 1, 0) where id = old.announcement_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists announcement_likes_bump on public.announcement_likes;
create trigger announcement_likes_bump
  after insert or delete on public.announcement_likes
  for each row execute procedure public.sync_announcement_likes_count();

create or replace function public.sync_announcement_comments_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.announcements set comments = comments + 1 where id = new.announcement_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.announcements set comments = greatest(comments - 1, 0) where id = old.announcement_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists announcement_comments_bump on public.announcement_comments;
create trigger announcement_comments_bump
  after insert or delete on public.announcement_comments
  for each row execute procedure public.sync_announcement_comments_count();

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
alter table public.announcements enable row level security;
alter table public.announcement_likes enable row level security;
alter table public.announcement_comments enable row level security;
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

-- Announcements: public read, admins write
create policy "announcements are viewable by everyone"
  on public.announcements for select using (true);

create policy "admins can create announcements"
  on public.announcements for insert with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin
    )
  );

create policy "admins can update announcements"
  on public.announcements for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin
    )
  );

create policy "admins can delete announcements"
  on public.announcements for delete using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin
    )
  );

-- Likes: everyone can see counts, users manage their own
create policy "announcement likes are viewable by everyone"
  on public.announcement_likes for select using (true);

create policy "users can like announcements"
  on public.announcement_likes for insert with check (auth.uid() = user_id);

create policy "users can remove their own likes"
  on public.announcement_likes for delete using (auth.uid() = user_id);

-- Comments: everyone can read, users manage their own
create policy "announcement comments are viewable by everyone"
  on public.announcement_comments for select using (true);

create policy "users can comment on announcements"
  on public.announcement_comments for insert with check (auth.uid() = user_id);

create policy "users can delete their own comments"
  on public.announcement_comments for delete using (auth.uid() = user_id);

-- Settings: public read, authenticated write
create policy "settings are viewable by everyone"
  on public.settings for select using (true);

create policy "authenticated users can update settings"
  on public.settings for all with check (auth.role() = 'authenticated');

-- ============================================================
-- Storage (announcement images)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('announcements', 'announcements', true)
on conflict (id) do nothing;

create policy "announcement images are publicly viewable"
  on storage.objects for select using (bucket_id = 'announcements');

create policy "admins can upload announcement images"
  on storage.objects for insert with check (
    bucket_id = 'announcements' and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin
    )
  );

-- ============================================================
-- Seed data (sample events so the app has content)
-- ============================================================
insert into public.events (title, location, starts_at)
select 'Sunday Worship Service', 'Main Sanctuary', now() + interval '3 days'
where not exists (select 1 from public.events where title = 'Sunday Worship Service');

insert into public.events (title, location, starts_at)
select 'Midweek Bible Study', 'Fellowship Hall', now() + interval '6 days'
where not exists (select 1 from public.events where title = 'Midweek Bible Study');

-- Sample announcements for the home feed
insert into public.announcements (author, avatar_color, title, body, category, banner, likes, comments, published_at)
select 'Berean AG', '#0d9488', 'Welcome to our new app! 🎉',
       'We''re excited to launch the new Berean AG app — announcements, events, notes and more, all in one place. Let us know what you think!',
       'Announcements',
       jsonb_build_object('icon', 'megaphone', 'label', 'New app launch', 'from', '#0d9488', 'to', '#115e59'),
       24, 6, now() - interval '2 hours'
where not exists (select 1 from public.announcements where title = 'Welcome to our new app! 🎉');

insert into public.announcements (author, avatar_color, title, body, category, likes, comments, published_at)
select 'Pastor David', '#7c3aed', 'This Sunday: “Rooted”',
       'Join us this Sunday at 10 AM as we continue our series “Rooted” — finding our foundation in Christ. Bring a friend!',
       'Worship', 18, 4, now() - interval '6 hours'
where not exists (select 1 from public.announcements where title = 'This Sunday: “Rooted”');

insert into public.announcements (author, avatar_color, title, body, category, banner, likes, comments, published_at)
select 'Youth Ministry', '#f59e0b', 'Youth night this Friday',
       'Games, worship and fellowship — Friday at 6:30 PM in the Youth Hall. All students are welcome!',
       'Youth',
       jsonb_build_object('icon', 'people', 'label', 'Youth Night · Fri 6:30 PM', 'from', '#f59e0b', 'to', '#ef4444'),
       12, 3, now() - interval '1 day'
where not exists (select 1 from public.announcements where title = 'Youth night this Friday');

insert into public.announcements (author, avatar_color, body, category, likes, comments, published_at)
select 'Prayer Team', '#059669',
       'Join us Wednesday at 6 AM in the prayer room as we lift up our community in prayer. All are welcome.',
       'Prayer', 9, 2, now() - interval '1 day'
where not exists (select 1 from public.announcements where author = 'Prayer Team');

-- -------------------------------------------------------------------
-- Grant posting rights to a user (replace the email, then run):
--   update public.profiles set is_admin = true
--   where email = 'pastor@example.com';
-- -------------------------------------------------------------------
