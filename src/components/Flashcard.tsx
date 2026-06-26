'use client'

import { useState, useCallback } from 'react'
import { RotateCcw, Volume2, Sparkles, RefreshCw } from 'lucide-react'
import { trackAPICall } from '@/lib/apiUsage'

type Props = {
  english: string
  portuguese: string
  example: string
  category: string
  onRate: (quality: number) => void
}

export default function Flashcard({ english, portuguese, example, category, onRate }: Props) {
  const [flipped, setFlipped] = useState(false)
  const [extras, setExtras] = useState<{ examples: string[]; tip: string } | null>(null)
  const [loadingExtras, setLoadingExtras] = useState(false)

  const speak = useCallback((text: string) => {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'; u.rate = 0.8
    speechSynthesis.speak(u)
  }, [])

  const loadExtras = async () => {
    if (extras || loadingExtras) return
    setLoadingExtras(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Give me 3 simple example sentences using the word "${english}" (${portuguese}) appropriate for an A1/A2 English learner. Also give a short memory tip in Portuguese to remember this word.\n\nFormat:\n1. [sentence] — [tradução]\n2. [sentence] — [tradução]\n3. [sentence] — [tradução]\n💡 Dica: [tip in Portuguese]` }],
          mode: 'writing',
          level: 'A1',
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
      }
      trackAPICall()

      const lines = result.split('\n').filter(l => l.trim())
      const exampleLines = lines.filter(l => /^\d/.test(l.trim())).slice(0, 3)
      const tipLine = lines.find(l => l.includes('Dica:') || l.includes('💡'))

      setExtras({
        examples: exampleLines.length > 0 ? exampleLines : [result.slice(0, 200)],
        tip: tipLine?.replace(/💡\s*Dica:\s*/i, '').trim() || '',
      })
    } catch { /* silent */ }
    setLoadingExtras(false)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        onClick={() => { if (!flipped) { setFlipped(true); speak(english) } }}
        className="cursor-pointer card min-h-[280px] flex flex-col items-center justify-center text-center relative overflow-hidden select-none"
        style={{ borderRadius: '24px' }}
      >
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[var(--primary)]/5" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-[var(--accent)]/5" />

        {!flipped ? (
          <div className="relative">
            <p className="text-4xl font-bold gradient-text">{english}</p>
            <span className="badge bg-[var(--primary-bg)] text-[var(--primary)] mt-3">{category}</span>
            <div className="mt-4 flex items-center gap-1.5 text-[var(--muted)] text-sm">
              <RotateCcw size={14} />
              Toque para ver a tradução
            </div>
          </div>
        ) : (
          <div className="relative space-y-2 w-full px-2">
            <div className="flex items-center justify-center gap-3">
              <p className="text-3xl font-bold text-[var(--success)]">{portuguese}</p>
              <button onClick={(e) => { e.stopPropagation(); speak(english) }} className="p-2 rounded-lg bg-[var(--primary-bg)] text-[var(--primary)] hover:bg-[var(--primary)]/20">
                <Volume2 size={16} />
              </button>
            </div>
            <p className="text-xl text-[var(--muted)]">{english}</p>

            {/* Original example */}
            {example && (
              <div className="mt-2 p-2 rounded-lg bg-[var(--primary-bg)]/50 text-left">
                <p className="text-sm italic text-[var(--muted)]">&quot;{example}&quot;</p>
              </div>
            )}

            {/* AI examples */}
            {extras ? (
              <div className="mt-2 space-y-1 text-left">
                {extras.examples.map((ex, i) => (
                  <p key={i} className="text-xs text-[var(--muted)]">{ex}</p>
                ))}
                {extras.tip && (
                  <div className="flex items-start gap-1.5 mt-2 p-2 rounded-lg bg-amber-500/10">
                    <Sparkles size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">{extras.tip}</p>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); loadExtras() }} disabled={loadingExtras}
                className="mt-2 flex items-center gap-1.5 mx-auto text-xs text-[var(--primary)] hover:underline">
                {loadingExtras ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                {loadingExtras ? 'Gerando exemplos...' : 'Ver mais exemplos + dica'}
              </button>
            )}
          </div>
        )}
      </div>

      {flipped && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {[
            { q: 1, label: 'Não lembrei', color: 'from-red-500 to-rose-500' },
            { q: 3, label: 'Difícil', color: 'from-amber-500 to-orange-500' },
            { q: 4, label: 'Bom', color: 'from-blue-500 to-cyan-500' },
            { q: 5, label: 'Fácil', color: 'from-emerald-500 to-teal-500' },
          ].map(({ q, label, color }) => (
            <button
              key={q}
              onClick={() => { onRate(q); setFlipped(false); setExtras(null) }}
              className={`py-2.5 rounded-xl text-white text-xs font-semibold bg-gradient-to-br ${color} shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
