'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { VocabWord, StudySession, TestResult } from '@/lib/supabase'
import { getCEFRLevel } from '@/lib/constants'
import { BarChart3, GraduationCap, BookOpen, Clock, Trophy } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

export default function ProgressoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [vocabCount, setVocabCount] = useState(0)
  const [studyData, setStudyData] = useState<{ date: string; minutes: number }[]>([])
  const [testData, setTestData] = useState<{ date: string; score: number }[]>([])
  const [totalMinutes, setTotalMinutes] = useState(0)
  const [totalTests, setTotalTests] = useState(0)
  const [avgScore, setAvgScore] = useState(0)
  const [vocabByCategory, setVocabByCategory] = useState<{ category: string; count: number }[]>([])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [vocabRes, sessionsRes, testsRes] = await Promise.all([
        supabase.from('vocab_words').select('*').eq('user_id', user.id),
        supabase.from('study_sessions').select('*').eq('user_id', user.id).order('date', { ascending: true }),
        supabase.from('test_results').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
      ])

      const words = (vocabRes.data || []) as VocabWord[]
      setVocabCount(words.length)

      const catMap: Record<string, number> = {}
      words.forEach((w) => { catMap[w.category] = (catMap[w.category] || 0) + 1 })
      setVocabByCategory(Object.entries(catMap).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count))

      const sessions = (sessionsRes.data || []) as StudySession[]
      setTotalMinutes(sessions.reduce((sum, s) => sum + s.minutes, 0))

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

      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  const cefr = getCEFRLevel(vocabCount, avgScore)

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
            <GraduationCap size={16} /> Nível estimado
          </div>
          <p className="text-5xl font-bold">{cefr.level}</p>
          <p className="text-white/70">{cefr.description}</p>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {[
              { icon: BookOpen, value: vocabCount, label: 'Palavras' },
              { icon: Clock, value: totalMinutes, label: 'Min. estudo' },
              { icon: Trophy, value: totalTests, label: 'Testes' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center bg-white/10 rounded-xl py-3">
                <Icon size={16} className="mx-auto mb-1 text-white/70" />
                <p className="text-xl font-bold">{value}</p>
                <p className="text-xs text-white/60">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

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
