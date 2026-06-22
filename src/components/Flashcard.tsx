'use client'

import { useState } from 'react'
import { RotateCcw } from 'lucide-react'

type Props = {
  english: string
  portuguese: string
  example: string
  onRate: (quality: number) => void
}

export default function Flashcard({ english, portuguese, example, onRate }: Props) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        onClick={() => setFlipped(!flipped)}
        className="cursor-pointer card min-h-[260px] flex flex-col items-center justify-center text-center relative overflow-hidden select-none"
        style={{ borderRadius: '24px' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[var(--primary)]/5" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-[var(--accent)]/5" />

        {!flipped ? (
          <div className="relative">
            <p className="text-4xl font-bold gradient-text">{english}</p>
            <div className="mt-4 flex items-center gap-1.5 text-[var(--muted)] text-sm">
              <RotateCcw size={14} />
              Toque para ver a tradução
            </div>
          </div>
        ) : (
          <div className="relative space-y-2">
            <p className="text-3xl font-bold text-[var(--success)]">{portuguese}</p>
            <p className="text-xl text-[var(--muted)]">{english}</p>
            {example && <p className="text-sm text-[var(--muted)] italic mt-3">&quot;{example}&quot;</p>}
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
              onClick={() => { onRate(q); setFlipped(false) }}
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
