import { createClient, SupabaseClient } from '@supabase/supabase-js'

export type VocabWord = {
  id: string
  user_id: string
  english: string
  portuguese: string
  example: string
  category: string
  interval: number
  repetitions: number
  ease_factor: number
  next_review: string
  created_at: string
}

export type WritingEntry = {
  id: string
  user_id: string
  prompt: string
  user_text: string
  correction: string
  created_at: string
}

export type Conversation = {
  id: string
  user_id: string
  topic: string
  messages: { role: 'user' | 'assistant'; content: string; correction?: string }[]
  created_at: string
}

export type TestResult = {
  id: string
  user_id: string
  type: 'vocabulary' | 'fill-blank' | 'translation' | 'dictation'
  score: number
  total: number
  details: Record<string, unknown>
  created_at: string
}

export type StudySession = {
  id: string
  user_id: string
  date: string
  minutes: number
  feature: string
  created_at: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: SupabaseClient<any> | null = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupabase(): SupabaseClient<any> {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    _client = createClient(url, key)
  }
  return _client
}

export const supabase = typeof window !== 'undefined'
  ? getSupabase()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  : (null as unknown as SupabaseClient<any>)
