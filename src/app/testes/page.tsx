'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { VocabWord } from '@/lib/supabase'
import StudyTimer from '@/components/StudyTimer'
import { CheckCircle, XCircle, RefreshCw, ClipboardList, Trophy, BookOpen, Languages, AlignLeft } from 'lucide-react'
import { useLevel } from '@/components/LevelContext'
import { triggerStudyTimer } from '@/components/StudyTimer'
import { trackAPICall } from '@/lib/apiUsage'

type TestType = 'vocabulary' | 'fill-blank' | 'translation'
type Question = { question: string; correct: string; options: string[]; hint?: string }

export default function TestesPage() {
  const router = useRouter()
  const { level } = useLevel()
  const [userId, setUserId] = useState('')
  const [testType, setTestType] = useState<TestType | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(false)
  const [words, setWords] = useState<VocabWord[]>([])
  const [translationInput, setTranslationInput] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data } = await supabase.from('vocab_words').select('*').eq('user_id', user.id)
      setWords((data || []) as VocabWord[])
    }
    load()
  }, [router])

  const startVocabTest = () => {
    if (words.length < 4) { alert('Você precisa de pelo menos 4 palavras.'); return }
    const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, 10)
    const qs: Question[] = shuffled.map((w) => {
      const wrongOptions = words.filter((o) => o.id !== w.id).sort(() => Math.random() - 0.5).slice(0, 3).map((o) => o.portuguese)
      return { question: w.english, correct: w.portuguese, options: [...wrongOptions, w.portuguese].sort(() => Math.random() - 0.5) }
    })
    setQuestions(qs); setCurrentQ(0); setScore(0); setSelected(null); setFinished(false); setTestType('vocabulary')
  }

  const startAITest = async (type: TestType) => {
    setLoading(true); setTestType(type)
    try {
      const vocabWords = words.slice(0, 20).map((w) => ({ english: w.english, portuguese: w.portuguese }))
      const res = await fetch('/api/exercise', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, words: vocabWords, count: 8, level }) })
      const data = await res.json()
      let qs: Question[] = []
      if (type === 'fill-blank' && data.questions) qs = data.questions.map((q: { sentence: string; answer: string; options: string[]; translation: string }) => ({ question: q.sentence, correct: q.answer, options: q.options, hint: q.translation }))
      else if (type === 'translation' && data.questions) qs = data.questions.map((q: { from: string; answer: string; hint: string }) => ({ question: q.from, correct: q.answer, options: [], hint: q.hint }))
      trackAPICall()
      setQuestions(qs); setCurrentQ(0); setScore(0); setSelected(null); setFinished(false)
    } catch { alert('Erro ao gerar teste.'); setTestType(null) }
    setLoading(false)
  }

  const handleAnswer = (answer: string) => {
    if (selected) return
    triggerStudyTimer()
    setSelected(answer)
    const isCorrect = answer.toLowerCase().trim() === questions[currentQ].correct.toLowerCase().trim()
    if (isCorrect) setScore(score + 1)
    setTimeout(() => {
      if (currentQ + 1 < questions.length) { setCurrentQ(currentQ + 1); setSelected(null) }
      else { setFinished(true); saveResult(isCorrect ? score + 1 : score) }
    }, 1500)
  }

  const saveResult = async (finalScore: number) => {
    if (!userId || !testType) return
    await supabase.from('test_results').insert({ user_id: userId, type: testType, score: finalScore, total: questions.length, details: {} })
  }

  if (!testType) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
              <ClipboardList size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Testes</h1>
              <p className="text-xs text-[var(--muted)]">Teste seu conhecimento</p>
            </div>
          </div>
          <StudyTimer feature="testes" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { action: startVocabTest, icon: BookOpen, label: 'Vocabulário', desc: 'Suas palavras salvas', color: 'from-blue-500 to-cyan-500', extra: `${words.length} palavras` },
            { action: () => startAITest('fill-blank'), icon: AlignLeft, label: 'Preencher Lacunas', desc: 'Gerado por IA', color: 'from-violet-500 to-purple-500', extra: '' },
            { action: () => startAITest('translation'), icon: Languages, label: 'Tradução', desc: 'Inglês ↔ Português', color: 'from-emerald-500 to-teal-500', extra: '' },
          ].map(({ action, icon: Icon, label, desc, color, extra }) => (
            <button key={label} onClick={action} className="card card-interactive text-left">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
                <Icon size={22} className="text-white" />
              </div>
              <h3 className="font-bold">{label}</h3>
              <p className="text-sm text-[var(--muted)]">{desc}</p>
              {extra && <p className="text-xs text-[var(--primary)] mt-1">{extra}</p>}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (loading) return <div className="flex flex-col items-center justify-center h-64 gap-3"><RefreshCw size={32} className="animate-spin text-[var(--primary)]" /><p className="text-[var(--muted)]">Gerando teste com IA...</p></div>

  if (finished) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${pct >= 70 ? 'bg-emerald-500/10' : pct >= 40 ? 'bg-amber-500/10' : 'bg-red-500/10'}`}>
          <Trophy size={36} className={pct >= 70 ? 'text-emerald-500' : pct >= 40 ? 'text-amber-500' : 'text-red-500'} />
        </div>
        <div className={`text-5xl font-bold ${pct >= 70 ? 'text-emerald-500' : pct >= 40 ? 'text-amber-500' : 'text-red-500'}`}>{pct}%</div>
        <p className="text-lg">{score} de {questions.length} corretas</p>
        <p className="text-[var(--muted)]">{pct >= 70 ? 'Muito bem! Continue assim!' : pct >= 40 ? 'Bom progresso! Continue praticando.' : 'Não desista! Revise o vocabulário.'}</p>
        <button onClick={() => setTestType(null)} className="btn-primary">Voltar aos testes</button>
      </div>
    )
  }

  const q = questions[currentQ]

  if (testType === 'translation') {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Tradução</h1>
          <span className="badge bg-[var(--primary-bg)] text-[var(--primary)]">{currentQ + 1}/{questions.length}</span>
        </div>
        <div className="card space-y-4" style={{ borderRadius: '24px' }}>
          <p className="text-xl font-semibold text-center">{q.question}</p>
          {q.hint && <p className="text-xs text-center text-[var(--muted)]">Dica: {q.hint}</p>}
          <input value={translationInput} onChange={(e) => setTranslationInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && translationInput.trim()) { handleAnswer(translationInput); setTranslationInput('') } }}
            placeholder="Digite a tradução..." className="input text-center text-lg" disabled={!!selected} />
          {selected && (
            <div className={`p-3 rounded-xl text-center text-sm ${selected.toLowerCase().trim() === q.correct.toLowerCase().trim() ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-red-50 dark:bg-red-900/20 text-red-600'}`}>
              Resposta correta: <strong>{q.correct}</strong>
            </div>
          )}
          {!selected && <button onClick={() => { handleAnswer(translationInput); setTranslationInput('') }} disabled={!translationInput.trim()} className="btn-primary w-full">Verificar</button>}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{testType === 'vocabulary' ? 'Vocabulário' : 'Preencher Lacunas'}</h1>
        <span className="badge bg-[var(--primary-bg)] text-[var(--primary)]">{currentQ + 1}/{questions.length}</span>
      </div>
      <div className="card space-y-4" style={{ borderRadius: '24px' }}>
        <p className="text-xl font-semibold text-center">{q.question}</p>
        {q.hint && <p className="text-xs text-center text-[var(--muted)]">{q.hint}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {q.options.map((opt) => {
            const isCorr = opt.toLowerCase() === q.correct.toLowerCase()
            const isSel = selected === opt
            let cls = 'bg-[var(--card)] border-[var(--card-border)] hover:border-[var(--primary)] hover:bg-[var(--primary-bg)]'
            if (selected) {
              if (isCorr) cls = 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-400'
              else if (isSel) cls = 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400'
            }
            return (
              <button key={opt} onClick={() => handleAnswer(opt)} disabled={!!selected}
                className={`p-3.5 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all ${cls}`}>
                {selected && isCorr && <CheckCircle size={16} />}
                {selected && isSel && !isCorr && <XCircle size={16} />}
                {opt}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
