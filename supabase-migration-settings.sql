-- Execute este SQL no Supabase SQL Editor
-- Tabela de configurações do usuário

create table user_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  level text default 'A1',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_settings enable row level security;
create policy "Users can manage their own settings" on user_settings for all using (auth.uid() = user_id);
