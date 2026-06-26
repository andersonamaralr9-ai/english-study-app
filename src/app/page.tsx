'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getNextClassFromSchedule, getCEFRLevel, type ClassScheduleEntry } from '@/lib/constants'
import { isDueForReview } from '@/lib/srs'
import { getDailyChallenge, getWordOfDay } from '@/lib/daily'
import type { VocabWord, StudySession, TestResult } from '@/lib/supabase'
import { BookOpen, MessageCircle, PenTool, Headphones, ClipboardList, Flame, GraduationCap, Clock, LogOut, ChevronRight, Zap, Target, Volume2, Plus } from 'lucide-react'
import LevelProgressCard from '@/components/LevelProgressCard'

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [vocabCount, setVocabCount] = useState(0)
  const [dueCount, setDueCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [todayMinutes, setTodayMinutes] = useState(0)
  const [avgScore, setAvgScore] = useState(0)
  const [classSchedule, setClassSchedule] = useState<ClassScheduleEntry[]>([])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [vocabRes, sessionsRes, testsRes, classesRes] = await Promise.all([
        supabase.from('vocab_words').select('*').eq('user_id', user.id),
        supabase.from('study_sessions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(30),
        supabase.from('test_results').select('score, total').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('user_classes').select('*').eq('user_id', user.id).order('day', { ascending: true }),
      ])

      const words = (vocabRes.data || []) as VocabWord[]
      setVocabCount(words.length)
      setDueCount(words.filter((w) => isDueForReview(w.next_review)).length)

      const sessions = (sessionsRes.data || []) as StudySession[]
      const today = new Date().toISOString().split('T')[0]
      setTodayMinutes(sessions.filter((s) => s.date === today).reduce((sum, s) => sum + s.minutes, 0))

      let s = 0
      const dates = [...new Set(sessions.map((ss) => ss.date))].sort().reverse()
      const checkDate = new Date()
      for (const d of dates) {
        const expected = checkDate.toISOString().split('T')[0]
        if (d === expected) { s++; checkDate.setDate(checkDate.getDate() - 1) }
        else break
      }
      setStreak(s)

      const tests = (testsRes.data || []) as TestResult[]
      if (tests.length > 0) {
        setAvgScore(Math.round(tests.reduce((sum, t) => sum + (t.score / t.total) * 100, 0) / tests.length))
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userClasses = ((classesRes.data || []) as any[]).map(c => ({
        day: c.day, startTime: c.start_time, endTime: c.end_time, teacher: c.teacher, type: c.type,
      }))
      setClassSchedule(userClasses)

      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  const nextClass = getNextClassFromSchedule(classSchedule)
  const cefr = getCEFRLevel(vocabCount, avgScore)

  const daily = getDailyChallenge()
  const wordOfDay = getWordOfDay()

  const quickLinks = [
    { href: '/vocabulario', label: 'Vocabulário', icon: BookOpen, gradient: 'from-blue-500 to-cyan-500', desc: dueCount > 0 ? `${dueCount} para revisar` : 'Adicionar palavras' },
    { href: '/gramatica', label: 'Gramática', icon: GraduationCap, gradient: 'from-indigo-500 to-blue-500', desc: 'Lições estruturadas' },
    { href: '/conversacao', label: 'Conversação', icon: MessageCircle, gradient: 'from-emerald-500 to-teal-500', desc: 'Praticar com IA' },
    { href: '/escrita', label: 'Escrita', icon: PenTool, gradient: 'from-violet-500 to-purple-500', desc: 'Escrever e corrigir' },
    { href: '/escuta', label: 'Escuta', icon: Headphones, gradient: 'from-amber-500 to-orange-500', desc: 'Ouvir e praticar' },
    { href: '/testes', label: 'Testes', icon: ClipboardList, gradient: 'from-rose-500 to-pink-500', desc: 'Testar conhecimento' },
  ]

  const addWordOfDay = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('vocab_words').insert({
      user_id: user.id, english: wordOfDay.english, portuguese: wordOfDay.portuguese,
      example: wordOfDay.example, category: wordOfDay.category,
      interval: 0, repetitions: 0, ease_factor: 2.5, next_review: today,
    })
    setVocabCount(vocabCount + 1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Olá! 👋</h1>
          <p className="text-[var(--muted)] text-sm">Vamos estudar inglês hoje?</p>
        </div>
        <button
          onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
          className="btn-ghost flex items-center gap-1.5"
        >
          <LogOut size={16} /> Sair
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Flame, label: 'Streak', value: `${streak}`, unit: 'dias', color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { icon: BookOpen, label: 'Palavras', value: `${vocabCount}`, unit: '', color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { icon: GraduationCap, label: 'Nível', value: cefr.level, unit: cefr.description, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { icon: Clock, label: 'Hoje', value: `${todayMinutes}`, unit: 'min', color: 'text-violet-500', bg: 'bg-violet-500/10' },
        ].map(({ icon: Icon, label, value, unit, color, bg }) => (
          <div key={label} className="card">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-bold leading-none">{value} <span className="text-sm font-normal text-[var(--muted)]">{unit}</span></p>
            <p className="text-xs text-[var(--muted)] mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Level progress */}
      <LevelProgressCard compact />

      {/* Next class */}
      {nextClass && (
        <div className="gradient-bg rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
          <div className="relative">
            <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
              <Zap size={14} />
              Próxima aula
            </div>
            <p className="text-xl font-bold">{nextClass.day} às {nextClass.startTime}</p>
            <p className="text-white/80 text-sm">com {nextClass.teacher} — {nextClass.type}</p>
            <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-sm font-medium">
              {nextClass.daysUntil === 0 ? 'Hoje!' : nextClass.daysUntil === 1 ? 'Amanhã' : `Em ${nextClass.daysUntil} dias`}
            </div>
          </div>
        </div>
      )}

      {/* Daily challenge + Word of day */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href={daily.href} className="card card-interactive">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-amber-500" />
            <span className="text-xs font-semibold text-amber-600 uppercase">Desafio do Dia</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{daily.icon}</span>
            <div>
              <p className="font-semibold text-sm">{daily.title}</p>
              <p className="text-xs text-[var(--muted)]">{daily.description}</p>
            </div>
          </div>
        </Link>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={16} className="text-blue-500" />
            <span className="text-xs font-semibold text-blue-600 uppercase">Palavra do Dia</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-[var(--primary)]">{wordOfDay.english}</p>
              <p className="text-sm text-[var(--muted)]">{wordOfDay.portuguese}</p>
              <p className="text-xs text-[var(--muted)] italic mt-1">&quot;{wordOfDay.example}&quot;</p>
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={() => { const u = new SpeechSynthesisUtterance(wordOfDay.english); u.lang = 'en-US'; u.rate = 0.8; speechSynthesis.speak(u) }}
                className="p-2 rounded-lg bg-[var(--primary-bg)] text-[var(--primary)] hover:bg-[var(--primary)]/20">
                <Volume2 size={16} />
              </button>
              <button onClick={addWordOfDay}
                className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" title="Adicionar ao vocabulário">
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">Estudar</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickLinks.map(({ href, label, icon: Icon, gradient, desc }) => (
            <Link key={href} href={href} className="card card-interactive flex items-center gap-4 group">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
                <Icon size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{label}</p>
                <p className="text-sm text-[var(--muted)]">{desc}</p>
              </div>
              <ChevronRight size={18} className="text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
