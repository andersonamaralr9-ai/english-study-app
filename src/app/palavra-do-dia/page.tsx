'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getWordOfDay } from '@/lib/daily'
import { useLevel } from '@/components/LevelContext'
import StudyTimer from '@/components/StudyTimer'
import { triggerStudyTimer } from '@/components/StudyTimer'
import { trackAPICall } from '@/lib/apiUsage'
import { BookOpen, Volume2, ChevronRight, CheckCircle, XCircle, Sparkles, RefreshCw, Star, Plus } from 'lucide-react'

type Activity = {
  type: 'context' | 'fill-blank' | 'translate' | 'tense' | 'synonym' | 'sentence' | 'listen'
  question: string
  answer: string
  options?: string[]
  explanation: string
  tip: string
}

export default function PalavradoDiaPage() {
  const router = useRouter()
  const { level } = useLevel()
  const [userId, setUserId] = useState('')
  const [word, setWord] = useState(getWordOfDay())
  const [activities, setActivities] = useState<Activity[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [wordAdded, setWordAdded] = useState(false)
  const [extraWordIdx, setExtraWordIdx] = useState(0)

  const EXTRA_WORDS = [
    { english: 'actually', portuguese: 'na verdade', example: 'Actually, I prefer tea.', category: 'Frases do Dia a Dia' },
    { english: 'realize', portuguese: 'perceber', example: 'I didn\'t realize it was so late.', category: 'Verbos Comuns' },
    { english: 'quite', portuguese: 'bastante', example: 'The movie was quite good.', category: 'Adjetivos' },
    { english: 'toward', portuguese: 'em direção a', example: 'She walked toward the door.', category: 'Frases do Dia a Dia' },
    { english: 'perhaps', portuguese: 'talvez', example: 'Perhaps we should leave now.', category: 'Frases do Dia a Dia' },
    { english: 'afford', portuguese: 'ter condições', example: 'I can\'t afford a new car.', category: 'Verbos Comuns' },
  ]

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
    }
    check()
  }, [router])

  const speak = useCallback((text: string) => {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'; u.rate = 0.8
    speechSynthesis.speak(u)
  }, [])

  const generateActivities = async () => {
    setLoading(true)
    triggerStudyTimer()
    try {
      const res = await fetch('/api/exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'word-deep',
          words: [{ english: word.english, portuguese: word.portuguese }],
          count: 15,
          level,
        }),
      })
      const data = await res.json()
      trackAPICall()
      if (data.activities) {
        setActivities(data.activities)
        setCurrentIdx(0)
        setScore({ correct: 0, total: 0 })
        setCompleted(false)
        setShowResult(false)
        setUserAnswer('')
      }
    } catch { /* fallback */ }
    setLoading(false)
  }

  const checkAnswer = () => {
    triggerStudyTimer()
    setShowResult(true)
    const activity = activities[currentIdx]
    const isCorrect = userAnswer.trim().toLowerCase() === activity.answer.toLowerCase()
    setScore({ correct: score.correct + (isCorrect ? 1 : 0), total: score.total + 1 })
  }

  const selectOption = (opt: string) => {
    setUserAnswer(opt)
    setShowResult(true)
    const activity = activities[currentIdx]
    const isCorrect = opt.toLowerCase() === activity.answer.toLowerCase()
    setScore({ correct: score.correct + (isCorrect ? 1 : 0), total: score.total + 1 })
  }

  const next = () => {
    if (currentIdx + 1 < activities.length) {
      setCurrentIdx(currentIdx + 1)
      setShowResult(false)
      setUserAnswer('')
    } else {
      setCompleted(true)
    }
  }

  const addWord = async () => {
    if (!userId || wordAdded) return
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('vocab_words').insert({
      user_id: userId, english: word.english, portuguese: word.portuguese,
      example: word.example, category: word.category,
      interval: 0, repetitions: 0, ease_factor: 2.5, next_review: today,
    })
    setWordAdded(true)
  }

  const nextWord = () => {
    const next = EXTRA_WORDS[extraWordIdx % EXTRA_WORDS.length]
    setWord(next)
    setExtraWordIdx(extraWordIdx + 1)
    setActivities([])
    setCompleted(false)
    setScore({ correct: 0, total: 0 })
    setWordAdded(false)
    setShowResult(false)
    setUserAnswer('')
  }

  // Before activities are generated
  if (activities.length === 0) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Star size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Palavra do Dia</h1>
              <p className="text-xs text-[var(--muted)]">Estudo completo de uma palavra</p>
            </div>
          </div>
          <StudyTimer feature="palavra-do-dia" />
        </div>

        {/* Word card */}
        <div className="card text-center py-8" style={{ borderRadius: '24px' }}>
          <button onClick={() => speak(word.english)} className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center hover:shadow-lg transition-shadow">
            <Volume2 size={28} className="text-white" />
          </button>
          <h2 className="text-4xl font-bold gradient-text mb-2">{word.english}</h2>
          <p className="text-xl text-[var(--muted)]">{word.portuguese}</p>
          <p className="text-sm text-[var(--muted)] italic mt-3">&quot;{word.example}&quot;</p>
          <span className="badge bg-[var(--primary-bg)] text-[var(--primary)] mt-3">{word.category}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={generateActivities} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-4">
            {loading ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {loading ? 'Gerando atividades...' : 'Iniciar atividades (15 exercícios)'}
          </button>
          <button onClick={addWord} disabled={wordAdded} className="btn-ghost w-full flex items-center justify-center gap-2 py-4 border border-[var(--card-border)]">
            {wordAdded ? <CheckCircle size={18} className="text-emerald-500" /> : <Plus size={18} />}
            {wordAdded ? 'Adicionada ao vocabulário!' : 'Adicionar ao vocabulário'}
          </button>
        </div>
      </div>
    )
  }

  // Completed
  if (completed) {
    const pct = Math.round((score.correct / score.total) * 100)
    return (
      <div className="space-y-5">
        <div className="card text-center py-12" style={{ borderRadius: '24px' }}>
          <div className={`w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center ${pct >= 70 ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
            <Star size={36} className={pct >= 70 ? 'text-emerald-500' : 'text-amber-500'} />
          </div>
          <h2 className="text-2xl font-bold mb-1">{pct >= 90 ? 'Excelente!' : pct >= 70 ? 'Muito bem!' : 'Continue praticando!'}</h2>
          <p className="text-4xl font-bold gradient-text mb-2">{pct}%</p>
          <p className="text-[var(--muted)]">{score.correct} de {score.total} corretas para &quot;{word.english}&quot;</p>

          <div className="flex gap-3 justify-center mt-6">
            <button onClick={nextWord} className="btn-primary flex items-center gap-2">
              <ChevronRight size={16} /> Próxima palavra
            </button>
            <button onClick={() => { setActivities([]); setCompleted(false); setScore({ correct: 0, total: 0 }) }} className="btn-ghost">
              Repetir
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Activity view
  const activity = activities[currentIdx]
  const isCorrect = showResult && userAnswer.toLowerCase() === activity.answer.toLowerCase()
  const hasOptions = activity.options && activity.options.length > 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Star size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{word.english}</h1>
            <p className="text-xs text-[var(--muted)]">{currentIdx + 1} de {activities.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StudyTimer feature="palavra-do-dia" />
          <span className="badge bg-[var(--primary-bg)] text-[var(--primary)]">{score.correct}/{score.total}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all" style={{ width: `${((currentIdx + 1) / activities.length) * 100}%` }} />
      </div>

      {/* Activity card */}
      <div className="card space-y-4" style={{ borderRadius: '24px' }}>
        <div className="badge bg-[var(--primary-bg)] text-[var(--primary)] text-xs">
          {activity.type === 'context' ? 'Contexto' : activity.type === 'fill-blank' ? 'Complete' : activity.type === 'translate' ? 'Tradução' : activity.type === 'tense' ? 'Tempo Verbal' : activity.type === 'synonym' ? 'Sinônimo' : activity.type === 'sentence' ? 'Frase' : 'Escuta'}
        </div>

        <p className="text-lg font-semibold">{activity.question}</p>

        {/* Input or options */}
        {hasOptions ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activity.options!.map((opt) => {
              const isThis = userAnswer === opt
              const isRight = opt.toLowerCase() === activity.answer.toLowerCase()
              let cls = 'bg-[var(--card)] border-[var(--card-border)] hover:border-[var(--primary)]'
              if (showResult) {
                if (isRight) cls = 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                else if (isThis) cls = 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400'
              }
              return (
                <button key={opt} onClick={() => !showResult && selectOption(opt)} disabled={showResult}
                  className={`p-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all ${cls}`}>
                  {showResult && isRight && <CheckCircle size={16} />}
                  {showResult && isThis && !isRight && <XCircle size={16} />}
                  {opt}
                </button>
              )
            })}
          </div>
        ) : (
          <input value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && userAnswer.trim() && !showResult && checkAnswer()}
            placeholder="Digite sua resposta..."
            className="input text-center text-lg" disabled={showResult} />
        )}

        {/* Result + explanation */}
        {showResult && (
          <div className={`p-4 rounded-xl space-y-3 ${isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800'}`}>
            <div className="flex items-center gap-2 font-semibold">
              {isCorrect ? <><CheckCircle size={18} className="text-emerald-600" /> Correto!</> : <><XCircle size={18} className="text-red-600" /> Resposta: <strong>{activity.answer}</strong></>}
            </div>

            {/* Explanation */}
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <BookOpen size={14} className="text-[var(--primary)] mt-0.5 flex-shrink-0" />
                <p>{activity.explanation}</p>
              </div>
              {activity.tip && (
                <div className="flex items-start gap-2">
                  <Sparkles size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[var(--muted)]">{activity.tip}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {!showResult && !hasOptions && (
          <button onClick={checkAnswer} disabled={!userAnswer.trim()} className="btn-primary w-full">Verificar</button>
        )}
        {showResult && (
          <button onClick={next} className="btn-primary w-full" style={{ background: 'linear-gradient(135deg, var(--success), #059669)' }}>
            {currentIdx + 1 < activities.length ? 'Próxima atividade' : 'Ver resultado'}
          </button>
        )}
      </div>
    </div>
  )
}
