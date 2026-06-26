'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useLevel } from './LevelContext'
import { calculateLevelProgress, type LevelProgressResult } from '@/lib/levelProgress'
import type { VocabWord, TestResult } from '@/lib/supabase'
import { TrendingUp, Star, ChevronRight, Sparkles, Target } from 'lucide-react'
import Link from 'next/link'

export default function LevelProgressCard({ compact = false }: { compact?: boolean }) {
  const { level } = useLevel()
  const [progress, setProgress] = useState<LevelProgressResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [vocabRes, testsRes, convosRes, writingsRes, sessionsRes] = await Promise.all([
        supabase.from('vocab_words').select('*').eq('user_id', user.id),
        supabase.from('test_results').select('score, total').eq('user_id', user.id),
        supabase.from('conversations').select('id').eq('user_id', user.id),
        supabase.from('writing_entries').select('id').eq('user_id', user.id),
        supabase.from('study_sessions').select('minutes').eq('user_id', user.id),
      ])

      const words = (vocabRes.data || []) as VocabWord[]
      const tests = (testsRes.data || []) as TestResult[]
      const testAvg = tests.length > 0
        ? Math.round(tests.reduce((sum, t) => sum + (t.score / t.total) * 100, 0) / tests.length)
        : 0

      const grammarCompleted = JSON.parse(localStorage.getItem('englishup_grammar_completed') || '[]')
      const grammarForLevel = grammarCompleted.filter((id: string) => id.startsWith(level.toLowerCase())).length

      const result = calculateLevelProgress(level, {
        vocabCount: words.length,
        masteredWords: words.filter(w => w.repetitions >= 3 && w.ease_factor >= 2.3).length,
        testAvg,
        conversationCount: (convosRes.data || []).length,
        writingCount: (writingsRes.data || []).length,
        grammarLessonsCompleted: grammarForLevel,
        studyMinutes: (sessionsRes.data || []).reduce((sum: number, s: { minutes: number }) => sum + s.minutes, 0),
      })

      setProgress(result)
      setLoading(false)
    }
    load()
  }, [level])

  if (loading || !progress) return null

  const milestoneColors: Record<string, string> = {
    beginning: 'from-gray-400 to-gray-500',
    started: 'from-blue-400 to-blue-600',
    halfway: 'from-amber-400 to-amber-600',
    almost: 'from-emerald-400 to-emerald-600',
    complete: 'from-violet-500 to-purple-600',
  }

  const milestoneIcons: Record<string, typeof Star> = {
    beginning: Target,
    started: TrendingUp,
    halfway: TrendingUp,
    almost: Sparkles,
    complete: Star,
  }

  const Icon = milestoneIcons[progress.milestone] || TrendingUp
  const gradient = milestoneColors[progress.milestone] || milestoneColors.beginning

  if (compact) {
    return (
      <Link href="/progresso" className="block p-4 rounded-2xl border border-[var(--card-border)] hover:shadow-lg transition-all" style={{ background: 'var(--card)' }}>
        <div className="flex items-center gap-4">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
            <span className="text-white font-bold text-xs">{progress.overallPercent}%</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">Progresso {progress.level}</p>
              {progress.nextLevel && <span className="text-xs text-[var(--muted)]">→ {progress.nextLevel}</span>}
            </div>
            <p className="text-xs text-[var(--muted)]">{progress.message}</p>
            <div className="mt-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-1000`} style={{ width: `${progress.overallPercent}%` }} />
            </div>
          </div>
          <ChevronRight size={16} className="text-[var(--muted)]" />
        </div>
      </Link>
    )
  }

  return (
    <div className="card" style={{ borderRadius: '24px' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <Icon size={24} className="text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">Progresso no {progress.level}</h2>
            {progress.nextLevel && <span className="badge bg-[var(--primary-bg)] text-[var(--primary)]">→ {progress.nextLevel}</span>}
          </div>
          <p className="text-sm text-[var(--muted)]">{progress.message}</p>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium">{progress.level}</span>
          <span className="font-bold text-[var(--primary)]">{progress.overallPercent}%</span>
          <span className="font-medium text-[var(--muted)]">{progress.nextLevel || 'Domínio'}</span>
        </div>
        <div className="h-4 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-1000 relative`} style={{ width: `${progress.overallPercent}%` }}>
            {progress.overallPercent >= 15 && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-white font-bold">{progress.overallPercent}%</span>
            )}
          </div>
        </div>
      </div>

      {/* Individual requirements */}
      <div className="space-y-2.5">
        {progress.requirements.map((req) => {
          const pct = Math.min(Math.round((req.current / req.target) * 100), 100)
          const done = pct >= 100
          return (
            <div key={req.label}>
              <div className="flex justify-between text-xs mb-0.5">
                <span className={done ? 'text-emerald-600 font-medium' : 'text-[var(--muted)]'}>
                  {done ? '✓ ' : ''}{req.label}
                </span>
                <span className={done ? 'text-emerald-600 font-bold' : 'text-[var(--muted)]'}>
                  {req.current}/{req.target} {req.unit}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${done ? 'bg-emerald-500' : 'bg-[var(--primary)]'}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
