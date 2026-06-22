# EnglishUp

App de estudo de inglês com IA para estudantes brasileiros.

## Funcionalidades

- **Vocabulário** — Flashcards com repetição espaçada (SM-2)
- **Conversação** — Chat com IA (Groq/Llama 3.3) como tutor de inglês
- **Escrita** — Escreva textos e receba correções com explicações em português
- **Escuta** — Ditado e pronúncia com Web Speech API
- **Testes** — Vocabulário, preencher lacunas e tradução (gerados por IA)
- **Progresso** — Gráficos de evolução, tempo de estudo e nível CEFR

## Stack

- **Next.js 14** (App Router)
- **Supabase** (PostgreSQL + Auth)
- **Groq** (Llama 3.3 70B - gratuito)
- **Tailwind CSS**
- **Recharts**

## Setup

1. Clone o repositório
2. `npm install`
3. Crie um projeto no [Supabase](https://supabase.com) e execute o `supabase-schema.sql`
4. Crie uma API key no [Groq](https://console.groq.com)
5. Copie `.env.local.example` para `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=sua_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_key
GROQ_API_KEY=sua_key
```

6. `npm run dev`

## Deploy

Deploy na Vercel com um clique:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/andersonamaralr9-ai/english-study-app&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,GROQ_API_KEY)
