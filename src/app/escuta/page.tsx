'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import StudyTimer from '@/components/StudyTimer'
import { Volume2, Mic, MicOff, RefreshCw, CheckCircle, XCircle, Headphones } from 'lucide-react'

type Sentence = { text: string; translation: string }

const SAMPLE_SENTENCES: Sentence[] = [
  { text: 'The cat is on the table.', translation: 'O gato está na mesa.' },
  { text: 'I like to eat pizza.', translation: 'Eu gosto de comer pizza.' },
  { text: 'She goes to school every day.', translation: 'Ela vai para a escola todo dia.' },
  { text: 'My name is Anderson.', translation: 'Meu nome é Anderson.' },
  { text: 'The weather is nice today.', translation: 'O clima está bom hoje.' },
  { text: 'I have two brothers.', translation: 'Eu tenho dois irmãos.' },
  { text: 'Can you help me please?', translation: 'Você pode me ajudar, por favor?' },
  { text: 'I work at a company.', translation: 'Eu trabalho em uma empresa.' },
]

export default function EscutaPage() {
  const router = useRouter()
  const [sentences, setSentences] = useState<Sentence[]>(SAMPLE_SENTENCES)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [mode, setMode] = useState<'dictation' | 'pronunciation'>('dictation')
  const [loadingAI, setLoadingAI] = useState(false)

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) router.push('/login')
    }
    check()
  }, [router])

  const speak = useCallback((text: string, rate = 0.8) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = rate
    speechSynthesis.speak(utterance)
  }, [])

  const loadAISentences = async () => {
    setLoadingAI(true)
    try {
      const res = await fetch('/api/exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'dictation', count: 8 }),
      })
      const data = await res.json()
      if (data.sentences) { setSentences(data.sentences); setCurrentIndex(0); setScore({ correct: 0, total: 0 }); setShowResult(false); setUserInput('') }
    } catch { /* fallback to defaults */ }
    setLoadingAI(false)
  }

  const checkAnswer = () => {
    setShowResult(true)
    const correct = userInput.trim().toLowerCase().replace(/[.,!?]/g, '') === sentences[currentIndex].text.toLowerCase().replace(/[.,!?]/g, '')
    setScore({ correct: score.correct + (correct ? 1 : 0), total: score.total + 1 })
  }

  const next = () => { setShowResult(false); setUserInput(''); setCurrentIndex((i) => (i + 1) % sentences.length) }

  const startListening = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const W = window as any
    const SpeechRecognitionCtor = W.SpeechRecognition || W.webkitSpeechRecognition
    if (!SpeechRecognitionCtor) { alert('Seu navegador não suporta reconhecimento de voz. Use Chrome.'); return }
    const recognition = new SpeechRecognitionCtor()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.onresult = (event: { results: { 0: { 0: { transcript: string } } } }) => { setUserInput(event.results[0][0].transcript); setIsListening(false) }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    setIsListening(true)
    recognition.start()
  }

  const current = sentences[currentIndex]
  const isCorrect = showResult && userInput.trim().toLowerCase().replace(/[.,!?]/g, '') === current.text.toLowerCase().replace(/[.,!?]/g, '')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Headphones size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Prática de Escuta</h1>
            <p className="text-xs text-[var(--muted)]">Ouça e pratique pronúncia</p>
          </div>
        </div>
        <StudyTimer feature="escuta" />
      </div>

      {/* Controls */}
      <div className="flex gap-2 flex-wrap">
        {(['dictation', 'pronunciation'] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${mode === m ? 'bg-[var(--primary)] text-white shadow-md' : 'bg-[var(--card)] border border-[var(--card-border)] text-[var(--muted)]'}`}>
            {m === 'dictation' ? 'Ditado (escrever)' : 'Pronúncia (falar)'}
          </button>
        ))}
        <button onClick={loadAISentences} disabled={loadingAI}
          className="btn-primary flex items-center gap-1.5 text-sm">
          <RefreshCw size={14} className={loadingAI ? 'animate-spin' : ''} /> Novas frases
        </button>
      </div>

      {score.total > 0 && (
        <div className="flex items-center gap-2">
          <div className="badge bg-[var(--primary-bg)] text-[var(--primary)]">
            {score.correct}/{score.total} ({Math.round(score.correct / score.total * 100)}%)
          </div>
        </div>
      )}

      {/* Exercise card */}
      <div className="card space-y-5" style={{ borderRadius: '24px' }}>
        <div className="text-center">
          <span className="badge bg-[var(--primary-bg)] text-[var(--primary)] mb-3">{currentIndex + 1} de {sentences.length}</span>
          <p className="text-sm text-[var(--muted)] mb-4">{current.translation}</p>
          <button onClick={() => speak(current.text)}
            className="mx-auto flex items-center gap-3 px-8 py-4 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
            <Volume2 size={24} /> Ouvir
          </button>
          <button onClick={() => speak(current.text, 0.5)} className="mt-2 text-xs text-[var(--muted)] hover:text-[var(--primary)]">
            Ouvir mais devagar
          </button>
        </div>

        {mode === 'dictation' ? (
          <input value={userInput} onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !showResult && userInput.trim() && checkAnswer()}
            placeholder="Digite o que você ouviu..." className="input text-center text-lg" disabled={showResult} />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <button onClick={startListening} disabled={isListening}
              className={`p-5 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)]'} text-white shadow-lg`}>
              {isListening ? <MicOff size={28} /> : <Mic size={28} />}
            </button>
            {userInput && <p className="text-lg font-medium">&quot;{userInput}&quot;</p>}
          </div>
        )}

        {showResult && (
          <div className={`p-4 rounded-xl text-center ${isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-red-50 dark:bg-red-900/20 text-red-600'}`}>
            <div className="flex items-center justify-center gap-2 font-semibold">
              {isCorrect ? <><CheckCircle size={18} /> Correto!</> : <><XCircle size={18} /> Incorreto</>}
            </div>
            {!isCorrect && <p className="mt-1 text-sm">Resposta: <strong>{current.text}</strong></p>}
          </div>
        )}

        {!showResult ? (
          <button onClick={checkAnswer} disabled={!userInput.trim()} className="btn-primary w-full">Verificar</button>
        ) : (
          <button onClick={next} className="btn-primary w-full" style={{ background: 'linear-gradient(135deg, var(--success), #059669)' }}>Próxima</button>
        )}
      </div>
    </div>
  )
}
