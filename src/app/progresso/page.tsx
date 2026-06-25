'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { VocabWord, StudySession, TestResult, WritingEntry, Conversation } from '@/lib/supabase'
import { BarChart3, GraduationCap, BookOpen, Clock, Trophy, MessageCircle, PenTool, TrendingUp, Award, Calendar } from 'lucide-react'
import { useLevel, LEVELS } from '@/components/LevelContext'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

export default function ProgressoPage() {
  const router = useRouter()
  const { level } = useLevel()
  const [loading, setLoading] = useState(true)
  const [vocabCount, setVocabCount] = useState(0)
  const [masteredCount, setMasteredCount] = useState(0)
  const [learningCount, setLearningCount] = useState(0)
  const [studyData, setStudyData] = useState<{ date: string; minutes: number }[]>([])
  const [testData, setTestData] = useState<{ date: string; score: number }[]>([])
  const [totalMinutes, setTotalMinutes] = useState(0)
  const [totalTests, setTotalTests] = useState(0)
  const [avgScore, setAvgScore] = useState(0)
  const [vocabByCategory, setVocabByCategory] = useState<{ category: string; count: number }[]>([])
  const [conversationCount, setConversationCount] = useState(0)
  const [writingCount, setWritingCount] = useState(0)
  const [weakWords, setWeakWords] = useState<VocabWord[]>([])
  const [recentWords, setRecentWords] = useState<VocabWord[]>([])
  const [featureBreakdown, setFeatureBreakdown] = useState<{ feature: string; minutes: number }[]>([])
  const [studyDays, setStudyDays] = useState(0)
  const [streak, setStreak] = useState(0)
  const [recentConversations, setRecentConversations] = useState<{ topic: string; date: string; msgCount: number }[]>([])
  const [recentWritings, setRecentWritings] = useState<{ prompt: string; date: string }[]>([])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [vocabRes, sessionsRes, testsRes, convoRes, writingRes] = await Promise.all([
        supabase.from('vocab_words').select('*').eq('user_id', user.id),
        supabase.from('study_sessions').select('*').eq('user_id', user.id).order('date', { ascending: true }),
        supabase.from('test_results').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
        supabase.from('conversations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('writing_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      ])

      const words = (vocabRes.data || []) as VocabWord[]
      setVocabCount(words.length)
      setMasteredCount(words.filter(w => w.repetitions >= 3 && w.ease_factor >= 2.3).length)
      setLearningCount(words.filter(w => w.repetitions > 0 && w.repetitions < 3).length)
      setWeakWords(words.filter(w => w.ease_factor < 2.0 || (w.repetitions > 0 && w.interval <= 1)).sort((a, b) => a.ease_factor - b.ease_factor).slice(0, 10))
      setRecentWords(words.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5))

      const catMap: Record<string, number> = {}
      words.forEach((w) => { catMap[w.category] = (catMap[w.category] || 0) + 1 })
      setVocabByCategory(Object.entries(catMap).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count))

      const sessions = (sessionsRes.data || []) as StudySession[]
      setTotalMinutes(sessions.reduce((sum, s) => sum + s.minutes, 0))

      // Feature breakdown
      const featureMap: Record<string, number> = {}
      sessions.forEach(s => { featureMap[s.feature] = (featureMap[s.feature] || 0) + s.minutes })
      const featureNames: Record<string, string> = { conversacao: 'Conversação', escrita: 'Escrita', escuta: 'Escuta', testes: 'Testes', vocabulario: 'Vocabulário' }
      setFeatureBreakdown(Object.entries(featureMap).map(([feature, minutes]) => ({ feature: featureNames[feature] || feature, minutes })).sort((a, b) => b.minutes - a.minutes))

      const dayMap: Record<string, number> = {}
      const today = new Date()
      for (let i = 13; i >= 0; i--) { const d = new Date(today); d.setDate(d.getDate() - i); dayMap[d.toISOString().split('T')[0]] = 0 }
      sessions.forEach((s) => { if (dayMap[s.date] !== undefined) dayMap[s.date] += s.minutes })
      setStudyData(Object.entries(dayMap).map(([date, minutes]) => ({ date: date.slice(5), minutes })))

      const tests = (testsRes.data || []) as TestResult[]
      setTotalTests(tests.length)
      if (tests.length > 0) {
        const avg = Math.round(tests.reduce((sum, t) => sum + (t.score / t.total) * 100, 0) / tests.length)
        setAvgScore(avg)
        setTestData(tests.slice(-20).map((t) => ({ date: new Date(t.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), score: Math.round((t.score / t.total) * 100) })))
      }

      const convos = (convoRes.data || []) as Conversation[]
      setConversationCount(convos.length)
      setRecentConversations(convos.slice(0, 5).map(c => ({
        topic: c.topic || 'Conversa',
        date: new Date(c.created_at).toLocaleDateString('pt-BR'),
        msgCount: (c.messages as unknown[]).length,
      })))

      const writings = (writingRes.data || []) as WritingEntry[]
      setWritingCount(writings.length)
      setRecentWritings(writings.slice(0, 5).map(w => ({
        prompt: w.prompt || 'Texto livre',
        date: new Date(w.created_at).toLocaleDateString('pt-BR'),
      })))

      // Study days and streak
      const uniqueDays = [...new Set(sessions.map(s => s.date))].sort().reverse()
      setStudyDays(uniqueDays.length)

      let s = 0
      const checkDate = new Date()
      for (const d of uniqueDays) {
        const expected = checkDate.toISOString().split('T')[0]
        if (d === expected) { s++; checkDate.setDate(checkDate.getDate() - 1) }
        else break
      }
      setStreak(s)

      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  const levelInfo = LEVELS.find(l => l.key === level) || LEVELS[0]
  const newCount = vocabCount - masteredCount - learningCount

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
          <BarChart3 size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Meu Progresso</h1>
          <p className="text-xs text-[var(--muted)]">Acompanhe sua evolução</p>
        </div>
      </div>

      {/* CEFR Level hero */}
      <div className="gradient-bg rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-12 translate-x-12" />
        <div className="relative">
          <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
            <GraduationCap size={16} /> Estudando nível
          </div>
          <p className="text-5xl font-bold">{levelInfo.key}</p>
          <p className="text-white/70">{levelInfo.desc}</p>
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-7 gap-3">
            {[
              { icon: Calendar, value: studyDays, label: 'Dias' },
              { icon: TrendingUp, value: streak, label: 'Streak' },
              { icon: BookOpen, value: vocabCount, label: 'Palavras' },
              { icon: Award, value: masteredCount, label: 'Dominadas' },
              { icon: Clock, value: totalMinutes, label: 'Min.' },
              { icon: MessageCircle, value: conversationCount, label: 'Conversas' },
              { icon: PenTool, value: writingCount, label: 'Escritas' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center bg-white/10 rounded-xl py-2.5">
                <Icon size={14} className="mx-auto mb-1 text-white/70" />
                <p className="text-lg font-bold">{value}</p>
                <p className="text-[10px] text-white/60">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vocabulary breakdown */}
      <div className="card">
        <h2 className="font-bold mb-3">Vocabulário</h2>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 rounded-xl bg-emerald-500/10">
            <p className="text-2xl font-bold text-emerald-600">{masteredCount}</p>
            <p className="text-xs text-[var(--muted)]">Dominadas</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-amber-500/10">
            <p className="text-2xl font-bold text-amber-600">{learningCount}</p>
            <p className="text-xs text-[var(--muted)]">Aprendendo</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-blue-500/10">
            <p className="text-2xl font-bold text-blue-600">{newCount}</p>
            <p className="text-xs text-[var(--muted)]">Novas</p>
          </div>
        </div>
        {vocabCount > 0 && (
          <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex">
            <div className="bg-emerald-500 h-full" style={{ width: `${(masteredCount / vocabCount) * 100}%` }} />
            <div className="bg-amber-500 h-full" style={{ width: `${(learningCount / vocabCount) * 100}%` }} />
            <div className="bg-blue-500 h-full" style={{ width: `${(newCount / vocabCount) * 100}%` }} />
          </div>
        )}
      </div>

      {/* Weak words - needs review */}
      {weakWords.length > 0 && (
        <div className="card border-amber-500/30">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-amber-500" />
            <h2 className="font-bold">Palavras que precisam de revisão</h2>
          </div>
          <p className="text-xs text-[var(--muted)] mb-3">Estas palavras tiveram mais dificuldade. Revise no Vocabulário!</p>
          <div className="flex flex-wrap gap-2">
            {weakWords.map(w => (
              <span key={w.id} className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm font-medium">
                {w.english} → {w.portuguese}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent words */}
      {recentWords.length > 0 && (
        <div className="card">
          <h2 className="font-bold mb-3">Últimas palavras adicionadas</h2>
          <div className="flex flex-wrap gap-2">
            {recentWords.map(w => (
              <span key={w.id} className="px-3 py-1.5 rounded-xl bg-[var(--primary-bg)] text-[var(--primary)] text-sm font-medium">
                {w.english}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Time by feature */}
      {featureBreakdown.length > 0 && (
        <div className="card">
          <h2 className="font-bold mb-3">Tempo por atividade</h2>
          <div className="space-y-2">
            {featureBreakdown.map(({ feature, minutes }) => (
              <div key={feature} className="flex items-center gap-3">
                <span className="text-sm w-28 text-[var(--muted)]">{feature}</span>
                <div className="flex-1 bg-[var(--primary-bg)] rounded-full h-6 overflow-hidden">
                  <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] rounded-full h-6 flex items-center justify-end pr-3 transition-all"
                    style={{ width: `${Math.max((minutes / Math.max(...featureBreakdown.map(f => f.minutes))) * 100, 15)}%` }}>
                    <span className="text-xs text-white font-bold">{minutes} min</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Study time chart */}
      <div className="card">
        <h2 className="font-bold mb-4">Tempo de Estudo (14 dias)</h2>
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={studyData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--muted)" />
              <YAxis tick={{ fontSize: 10 }} stroke="var(--muted)" />
              <Tooltip formatter={(value) => [`${value} min`, 'Tempo']} contentStyle={{ borderRadius: 12, border: '1px solid var(--card-border)', background: 'var(--card)' }} />
              <Bar dataKey="minutes" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Test scores chart */}
      {testData.length > 0 && (
        <div className="card">
          <h2 className="font-bold mb-4">Notas dos Testes <span className="text-sm font-normal text-[var(--muted)]">(média: {avgScore}%)</span></h2>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={testData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--muted)" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="var(--muted)" />
                <Tooltip formatter={(value) => [`${value}%`, 'Nota']} contentStyle={{ borderRadius: 12, border: '1px solid var(--card-border)', background: 'var(--card)' }} />
                <Line type="monotone" dataKey="score" stroke="var(--success)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--success)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent conversations */}
      {recentConversations.length > 0 && (
        <div className="card">
          <h2 className="font-bold mb-3">Últimas Conversas</h2>
          <div className="space-y-2">
            {recentConversations.map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--primary-bg)]/30">
                <MessageCircle size={14} className="text-emerald-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.topic}</p>
                  <p className="text-[10px] text-[var(--muted)]">{c.date} • {c.msgCount} mensagens</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent writings */}
      {recentWritings.length > 0 && (
        <div className="card">
          <h2 className="font-bold mb-3">Últimas Escritas</h2>
          <div className="space-y-2">
            {recentWritings.map((w, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--primary-bg)]/30">
                <PenTool size={14} className="text-violet-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{w.prompt}</p>
                  <p className="text-[10px] text-[var(--muted)]">{w.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vocab by category */}
      {vocabByCategory.length > 0 && (
        <div className="card">
          <h2 className="font-bold mb-4">Palavras por Categoria</h2>
          <div className="space-y-3">
            {vocabByCategory.map(({ category, count }) => (
              <div key={category} className="flex items-center gap-3">
                <span className="text-sm w-28 truncate text-[var(--muted)]">{category}</span>
                <div className="flex-1 bg-[var(--primary-bg)] rounded-full h-6 overflow-hidden">
                  <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] rounded-full h-6 flex items-center justify-end pr-3 transition-all"
                    style={{ width: `${Math.max((count / vocabCount) * 100, 15)}%` }}>
                    <span className="text-xs text-white font-bold">{count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
