'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useLevel, LEVELS } from '@/components/LevelContext'
import { getLessonsForLevel, type GrammarLesson } from '@/lib/grammar'
import StudyTimer from '@/components/StudyTimer'
import { triggerStudyTimer } from '@/components/StudyTimer'
import { trackAPICall } from '@/lib/apiUsage'
import { BookOpen, ChevronRight, ChevronLeft, CheckCircle, Volume2, Sparkles } from 'lucide-react'

export default function GramaticaPage() {
  const router = useRouter()
  const { level } = useLevel()
  const [lessons, setLessons] = useState<GrammarLesson[]>([])
  const [selectedLesson, setSelectedLesson] = useState<GrammarLesson | null>(null)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [practiceAnswer, setPracticeAnswer] = useState('')
  const [showAIHelp, setShowAIHelp] = useState(false)
  const [aiResponse, setAiResponse] = useState('')
  const [loadingAI, setLoadingAI] = useState(false)

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
    }
    check()
    const saved = localStorage.getItem('englishup_grammar_completed')
    if (saved) setCompletedIds(new Set(JSON.parse(saved)))
  }, [router])

  useEffect(() => {
    setLessons(getLessonsForLevel(level))
    setSelectedLesson(null)
  }, [level])

  const markComplete = (id: string) => {
    const updated = new Set(completedIds)
    updated.add(id)
    setCompletedIds(updated)
    localStorage.setItem('englishup_grammar_completed', JSON.stringify([...updated]))
  }

  const speak = (text: string) => {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'; u.rate = 0.8
    speechSynthesis.speak(u)
  }

  const askAI = async (lesson: GrammarLesson) => {
    triggerStudyTimer()
    setLoadingAI(true); setAiResponse(''); setShowAIHelp(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `I'm practicing "${lesson.title}". Here is my answer to the practice exercise:\n\n${practiceAnswer}\n\nThe exercise was: ${lesson.practice}\n\nPlease check my answers, correct mistakes, and explain in Portuguese.` }],
          mode: 'writing', level,
        }),
      })
      const reader = res.body?.getReader()
      if (!reader) return
      let result = ''
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        result += decoder.decode(value, { stream: true })
        setAiResponse(result)
      }
      trackAPICall()
    } catch { setAiResponse('Erro ao conectar com a IA.') }
    setLoadingAI(false)
  }

  if (selectedLesson) {
    const currentIdx = lessons.findIndex(l => l.id === selectedLesson.id)
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => { setSelectedLesson(null); setShowAIHelp(false); setAiResponse(''); setPracticeAnswer('') }} className="btn-ghost flex items-center gap-1">
            <ChevronLeft size={16} /> Voltar
          </button>
          <StudyTimer feature="gramatica" />
        </div>

        <div className="card" style={{ borderRadius: '24px' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge bg-[var(--primary-bg)] text-[var(--primary)]">{selectedLesson.level}</span>
            <span className="text-xs text-[var(--muted)]">Lição {selectedLesson.order}</span>
          </div>
          <h1 className="text-2xl font-bold">{selectedLesson.title}</h1>
          <p className="text-[var(--muted)]">{selectedLesson.titlePt}</p>
        </div>

        <div className="card">
          <h2 className="font-bold mb-2">Explicação</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">{selectedLesson.description}</p>
        </div>

        <div className="card">
          <h2 className="font-bold mb-3">Regras</h2>
          <div className="space-y-2">
            {selectedLesson.rules.map((rule, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-[var(--primary)] font-bold mt-0.5">•</span>
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="font-bold mb-3">Exemplos</h2>
          <div className="space-y-3">
            {selectedLesson.examples.map((ex, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--primary-bg)]/50">
                <button onClick={() => speak(ex.en)} className="text-[var(--primary)] hover:text-[var(--primary-dark)]">
                  <Volume2 size={16} />
                </button>
                <div>
                  <p className="text-sm font-medium">{ex.en}</p>
                  <p className="text-xs text-[var(--muted)]">{ex.pt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card border-[var(--primary)]/30">
          <h2 className="font-bold mb-2">Pratique!</h2>
          <p className="text-sm text-[var(--muted)] mb-3">{selectedLesson.practice}</p>
          <textarea
            value={practiceAnswer}
            onChange={(e) => setPracticeAnswer(e.target.value)}
            placeholder="Escreva suas respostas aqui..."
            className="input resize-none mb-3"
            rows={3}
          />
          <div className="flex gap-2">
            <button onClick={() => askAI(selectedLesson)} disabled={loadingAI || !practiceAnswer.trim()} className="btn-primary flex items-center gap-2">
              <Sparkles size={16} /> {loadingAI ? 'Verificando...' : 'Verificar com IA'}
            </button>
            <button onClick={() => { markComplete(selectedLesson.id) }} className="btn-ghost flex items-center gap-2 text-emerald-600">
              <CheckCircle size={16} /> Marcar como concluída
            </button>
          </div>
        </div>

        {showAIHelp && aiResponse && (
          <div className="card border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-900/10">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm mb-3">
              <Sparkles size={16} /> Correção da IA
            </div>
            <div className="text-sm whitespace-pre-wrap leading-relaxed">{aiResponse}</div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <button onClick={() => { if (currentIdx > 0) { setSelectedLesson(lessons[currentIdx - 1]); setShowAIHelp(false); setAiResponse(''); setPracticeAnswer('') } }}
            disabled={currentIdx === 0} className="btn-ghost flex items-center gap-1 disabled:opacity-30">
            <ChevronLeft size={16} /> Anterior
          </button>
          <button onClick={() => { if (currentIdx < lessons.length - 1) { setSelectedLesson(lessons[currentIdx + 1]); setShowAIHelp(false); setAiResponse(''); setPracticeAnswer('') } }}
            disabled={currentIdx === lessons.length - 1} className="btn-ghost flex items-center gap-1 disabled:opacity-30">
            Próxima <ChevronRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
            <BookOpen size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Gramática</h1>
            <p className="text-xs text-[var(--muted)]">Lições de {level} — {LEVELS.find(l => l.key === level)?.desc}</p>
          </div>
        </div>
        <StudyTimer feature="gramatica" />
      </div>

      <div className="text-sm text-[var(--muted)]">
        {completedIds.size > 0 && <span className="badge bg-emerald-500/10 text-emerald-600">{[...completedIds].filter(id => id.startsWith(level.toLowerCase())).length}/{lessons.length} concluídas</span>}
      </div>

      {lessons.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-[var(--muted)]">Lições para {level} em breve!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {lessons.map((lesson, i) => {
            const completed = completedIds.has(lesson.id)
            return (
              <button key={lesson.id} onClick={() => setSelectedLesson(lesson)}
                className="card card-interactive w-full text-left flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  completed ? 'bg-emerald-500/10 text-emerald-600' : 'bg-[var(--primary-bg)] text-[var(--primary)]'
                }`}>
                  {completed ? <CheckCircle size={20} /> : <span className="text-sm font-bold">{i + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{lesson.title}</p>
                  <p className="text-sm text-[var(--muted)]">{lesson.titlePt}</p>
                </div>
                <ChevronRight size={18} className="text-[var(--muted)]" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
