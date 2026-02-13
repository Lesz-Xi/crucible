-- MASA Persistent Memory v1 (Additive)
-- Timeline anchor: 2026-02-13

create table if not exists public.causal_compaction_receipts (
  id bigserial primary key,
  compaction_id uuid not null unique,
  session_id uuid not null references public.causal_chat_sessions(id) on delete cascade,
  window_start_message_id uuid null references public.causal_chat_messages(id) on delete set null,
  window_end_message_id uuid null references public.causal_chat_messages(id) on delete set null,
  entries_extracted integer not null default 0,
  summary_fallback_used boolean not null default false,
  duration_ms integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.causal_pruning_decisions (
  id bigserial primary key,
  session_id uuid not null references public.causal_chat_sessions(id) on delete cascade,
  message_id text not null,
  eligible boolean not null,
  reason text not null,
  cache_ttl_state text not null check (cache_ttl_state in ('cache_ttl_fresh', 'cache_ttl_expired', 'unknown')),
  keep_priority_score numeric not null default 0,
  causal_level text not null check (causal_level in ('L1', 'L2', 'L3')),
  created_at timestamptz not null default now()
);

create table if not exists public.causal_memory_entries (
  id uuid primary key,
  session_id uuid not null references public.causal_chat_sessions(id) on delete cascade,
  trace_id uuid null,
  source_message_ids uuid[] not null default '{}',
  domain text not null default 'abstract',
  causal_level text not null check (causal_level in ('L1', 'L2', 'L3')),
  axiom text not null,
  confidence numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.cross_session_axiom_events (
  id uuid primary key,
  origin_session_id uuid not null references public.causal_chat_sessions(id) on delete cascade,
  target_session_id uuid not null references public.causal_chat_sessions(id) on delete cascade,
  axiom_ids uuid[] not null default '{}',
  policy text not null,
  accepted boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_causal_compaction_receipts_session_created
  on public.causal_compaction_receipts(session_id, created_at desc);

create index if not exists idx_causal_pruning_decisions_session_created
  on public.causal_pruning_decisions(session_id, created_at desc);

create index if not exists idx_causal_memory_entries_session_confidence
  on public.causal_memory_entries(session_id, confidence desc);

create index if not exists idx_cross_session_axiom_events_origin_target
  on public.cross_session_axiom_events(origin_session_id, target_session_id, created_at desc);
