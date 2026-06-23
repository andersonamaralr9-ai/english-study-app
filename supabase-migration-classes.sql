-- Execute este SQL no Supabase SQL Editor para adicionar a tabela de aulas
-- Vá em SQL Editor > New query > Cole e execute

create table user_classes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  day integer not null, -- 0=Domingo, 1=Segunda, ..., 6=Sábado
  start_time text not null,
  end_time text not null,
  teacher text default '',
  type text default 'Conversação',
  created_at timestamptz default now()
);

alter table user_classes enable row level security;
create policy "Users can manage their own classes" on user_classes for all using (auth.uid() = user_id);
create index idx_classes_user on user_classes(user_id);
