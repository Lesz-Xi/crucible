create table if not exists public.bridge_verification_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text,
  message_id text,
  user_id text,
  source text not null default 'unknown',
  verdict text not null default 'verified',
  model text,
  confidence numeric,
  request_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip text,
  user_agent text
);

create index if not exists idx_bridge_verification_log_created_at
  on public.bridge_verification_log (created_at desc);

create index if not exists idx_bridge_verification_log_source
  on public.bridge_verification_log (source);

create index if not exists idx_bridge_verification_log_request_id
  on public.bridge_verification_log (request_id);

alter table public.bridge_verification_log enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'bridge_verification_log'
      and policyname = 'Allow service role full access on bridge_verification_log'
  ) then
    create policy "Allow service role full access on bridge_verification_log"
      on public.bridge_verification_log
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;
