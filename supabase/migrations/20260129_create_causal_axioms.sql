-- Create table for storing Compressed Causal Axioms (Fractal Memory)
create table if not exists causal_axioms (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references causal_chat_sessions(id) on delete cascade,
  axiom_content text not null, -- The compressed "Truth" or "Law" derived from the messages
  derived_from_messages uuid[], -- Array of message IDs that were compressed into this axiom
  confidence_score float, -- The reliability of this axiom (0.0 to 1.0)
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table causal_axioms enable row level security;

-- Create policies (assuming public access for now as per project pattern, or authenticated)
-- Allow all operations for authenticated users and anon (if currently using anon key in dev)
create policy "Allow all operations for causal_axioms"
  on causal_axioms for all
  using (true)
  with check (true);

-- Add comment
comment on table causal_axioms is 'Stores compressed causal insights (axioms) derived from chat history to enable Fractal Memory.';
