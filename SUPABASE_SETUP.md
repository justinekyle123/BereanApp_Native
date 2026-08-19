# Supabase Setup Guide

This guide walks through creating a Supabase project and connecting this app to it.

## 1. Create a Supabase project

1. Go to the [Supabase Dashboard](https://supabase.com/dashboard) and sign up or sign in (GitHub, GitLab, or email).
2. Click **New project**.
3. Fill in the project details:
   - **Organization** — choose or create one (e.g. your team name).
   - **Project name** — e.g. `berean-ag`.
   - **Database password** — set a strong password and save it somewhere safe (you'll need it to connect directly to the database).
   - **Region** — pick the region closest to your users for lowest latency.
4. Click **Create new project** and wait for provisioning to finish (a few minutes).
5. Once created, your project is ready with:
   - A **Postgres database** (empty, ready for tables)
   - **Auth** with Email/Password enabled by default
   - **Storage** buckets (none created by default)

## 2. Get your project credentials

The app connects with two values, both found in **Project Settings → API**:

| Value | Where to find it | Example |
| --- | --- | --- |
| Project URL | Project Settings → API → Project URL | `https://abcdefghijklm.supabase.co` |
| Publishable key | Project Settings → API → Publishable key | `eyJhbGciOiJIUzI1NiIs...` |

> **Note on the key name:** New projects label this key *publishable key*; older projects call it the *anon public* key. They are the same JWT.
>
> These keys are safe to embed in a client app — access to data is protected by Row Level Security (RLS), not by the key. Never use the **service_role** key in the app: it bypasses RLS and must stay secret.

## 3. Connect the app

1. Create your env file from the example:

   ```bash
   cp .env.example .env
   ```

2. Fill in the values you copied in step 2:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://abcdefghijklm.supabase.co
   EXPO_PUBLIC_SUPABASE_KEY=your-publishable-key
   ```

3. Restart the dev server:

   ```bash
   npm start
   ```

   Expo inlines `EXPO_PUBLIC_*` variables at build time, so **always restart the dev server** after changing `.env`.

The client is already set up in `config/supabase.ts`. It:

- Reads the env vars above and throws a clear error if they're missing
- Persists the auth session with AsyncStorage (native only; on web it uses the default memory storage)
- Uses `processLock` to serialize session refreshes
- Automatically keeps the session fresh while the app is in the foreground (via `AppState`)

## 4. Verify the connection

Run a query anywhere in the app (or temporarily in `App.tsx`):

```typescript
import { supabase } from "./config/supabase";

async function testConnection() {
  const { data, error } = await supabase.from("profiles").select("*").limit(1);
  if (error) {
    console.error("Supabase connection error:", error.message);
  } else {
    console.log("Supabase connected successfully", data);
  }
}
```

If `error` is not `null`:

- Double-check the values in `.env` match **Project Settings → API**.
- Make sure you restarted the dev server after editing `.env`.
- If the error is about a missing table (`relation "profiles" does not exist`), that's expected — create the table first (see below).

## 5. Next steps (optional)

### Create tables

Use the **SQL Editor** in the dashboard to create tables. For example:

```sql
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
```

### Enable auth providers

Go to **Authentication → Sign In / Up → Providers** to enable Email (on by default), Google, GitHub, Apple, etc.

### Create storage buckets

Go to **Storage → New bucket** to create buckets for file uploads (e.g. `avatars`, `notes-attachments`), then add RLS policies to control access.

### Use Supabase in your services

Import the client anywhere:

```typescript
import { supabase } from "./config/supabase";

// Example: email/password sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: "user@example.com",
  password: "password",
});

// Example: read from a table
const { data: rows, error } = await supabase.from("notes").select("*");
```

## Troubleshooting

- **`Missing Supabase configuration` error** — `.env` doesn't exist or is missing the variables. Run `cp .env.example .env` and fill it in.
- **Connection refused / timeout** — the project URL is wrong, or the region/URL has a typo. Copy the exact URL from Project Settings → API.
- **`Invalid API key`** — the publishable key doesn't belong to the project at the URL you configured.
- **`permission denied for table`** — the table has RLS enabled but no policies. Add a policy via SQL Editor or the Table Editor → RLS Policies panel.
