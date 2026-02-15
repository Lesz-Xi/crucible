-- Create chat_folders table
create table if not exists chat_folders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add folder_id to causal_chat_sessions
alter table causal_chat_sessions 
add column if not exists folder_id uuid references chat_folders(id) on delete set null;

-- Add RLS policies for chat_folders
alter table chat_folders enable row level security;

create policy "Users can view their own folders"
  on chat_folders for select
  using (auth.uid() = user_id);

create policy "Users can insert their own folders"
  on chat_folders for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own folders"
  on chat_folders for update
  using (auth.uid() = user_id);

create policy "Users can delete their own folders"
  on chat_folders for delete
  using (auth.uid() = user_id);
