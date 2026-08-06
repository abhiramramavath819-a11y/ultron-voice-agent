-- ULTRON conversation store.
-- Run against Vercel Postgres / Neon:  npm run migrate

create table if not exists sessions (
  id           text primary key,
  language     text        not null default 'en-IN',
  attitude     text        not null default 'ultron',
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists messages (
  id         bigserial primary key,
  session_id text        not null references sessions(id) on delete cascade,
  role       text        not null check (role in ('user', 'assistant')),
  content    text        not null,
  language   text        not null default 'en-IN',
  latency_ms integer,
  created_at timestamptz not null default now()
);

create index if not exists messages_session_time_idx
  on messages (session_id, created_at);

create index if not exists messages_language_idx
  on messages (language);
