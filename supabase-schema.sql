-- Execute este SQL no Supabase SQL Editor (https://supabase.com/dashboard)
-- Vá em SQL Editor > New query > Cole e execute

-- Tabela de vocabulário
create table vocab_words (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  english text not null,
  portuguese text not null,
  example text default '',
  category text default 'Outros',
  interval integer default 0,
  repetitions integer default 0,
  ease_factor real default 2.5,
  next_review date default current_date,
  created_at timestamptz default now()
);

-- Tabela de entradas de escrita
create table writing_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  prompt text default '',
  user_text text not null,
  correction text default '',
  created_at timestamptz default now()
);

-- Tabela de conversações
create table conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  topic text default '',
  messages jsonb default '[]',
  created_at timestamptz default now()
);

-- Tabela de resultados de testes
create table test_results (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null,
  score integer not null,
  total integer not null,
  details jsonb default '{}',
  created_at timestamptz default now()
);

-- Tabela de sessões de estudo
create table study_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  minutes integer not null,
  feature text not null,
  created_at timestamptz default now()
);

-- Habilitar Row Level Security em todas as tabelas
alter table vocab_words enable row level security;
alter table writing_entries enable row level security;
alter table conversations enable row level security;
alter table test_results enable row level security;
alter table study_sessions enable row level security;

-- Políticas de RLS: cada usuário só vê seus próprios dados
create policy "Users can manage their own vocab" on vocab_words for all using (auth.uid() = user_id);
create policy "Users can manage their own writing" on writing_entries for all using (auth.uid() = user_id);
create policy "Users can manage their own conversations" on conversations for all using (auth.uid() = user_id);
create policy "Users can manage their own tests" on test_results for all using (auth.uid() = user_id);
create policy "Users can manage their own study sessions" on study_sessions for all using (auth.uid() = user_id);

-- Índices para melhor performance
create index idx_vocab_user_review on vocab_words(user_id, next_review);
create index idx_sessions_user_date on study_sessions(user_id, date);
create index idx_tests_user_date on test_results(user_id, created_at);
