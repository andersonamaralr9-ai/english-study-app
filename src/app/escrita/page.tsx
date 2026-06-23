'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import StudyTimer from '@/components/StudyTimer'
import { PenTool, Sparkles, History } from 'lucide-react'
import { useLevel } from '@/components/LevelContext'
import { triggerStudyTimer } from '@/components/StudyTimer'

const PROMPTS = [
  'Describe your daily routine.',
  'Write about your family.',
  'What did you do last weekend?',
  'Describe your favorite food.',
  'Write about your job or school.',
  'What do you like to do for fun?',
  'Describe your city.',
  'Write about your best friend.',
]

export default function EscritaPage() {
  const router = useRouter()
  const { level } = useLevel()
  const [userId, setUserId] = useState('')
  const [prompt, setPrompt] = useState('')
  const [text, setText] = useState('')
  const [correction, setCorrection] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<{ id: string; prompt: string; user_text: string; correction: string; created_at: string }[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data } = await supabase.from('writing_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
      setHistory(data || [])
    }
    load()
  }, [router])

  const handleSubmit = async () => {
    if (!text.trim()) return
    triggerStudyTimer()
    setLoading(true); setCorrection('')
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Please correct my English writing. The prompt was: "${prompt}"\n\nMy text:\n${text}` }],
          mode: 'writing',
          level,
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
        setCorrection(result)
      }
      await supabase.from('writing_entries').insert({ user_id: userId, prompt, user_text: text, correction: result })
      setHistory([{ id: crypto.randomUUID(), prompt, user_text: text, correction: result, created_at: new Date().toISOString() }, ...history])
    } catch { setCorrection('Erro ao conectar com a IA.') }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
            <PenTool size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Prática de Escrita</h1>
            <p className="text-xs text-[var(--muted)]">Escreva e receba correções com IA</p>
          </div>
        </div>
        <StudyTimer feature="escrita" />
      </div>

      {/* Prompt selection */}
      <div className="card">
        <p className="text-sm font-semibold mb-3">Escolha um tema:</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {PROMPTS.map((p) => (
            <button key={p} onClick={() => setPrompt(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                prompt === p ? 'bg-[var(--primary)] text-white shadow-md' : 'bg-[var(--primary-bg)] text-[var(--primary)] hover:bg-[var(--primary)]/20'
              }`}>{p}</button>
          ))}
        </div>
        <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ou escreva seu próprio tema..." className="input" />
      </div>

      {/* Writing area */}
      <div className="card">
        <p className="text-sm font-semibold mb-3">Escreva em inglês:</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Write your text here in English..."
          rows={6} className="input resize-none" style={{ minHeight: '150px' }} />
        <div className="flex justify-between items-center mt-3">
          <span className="text-xs text-[var(--muted)]">{text.split(/\s+/).filter(Boolean).length} palavras</span>
          <button onClick={handleSubmit} disabled={loading || !text.trim()} className="btn-primary flex items-center gap-2">
            <Sparkles size={16} /> {loading ? 'Corrigindo...' : 'Corrigir com IA'}
          </button>
        </div>
      </div>

      {/* Correction */}
      {correction && (
        <div className="card border-[var(--success)]/30 bg-emerald-50/50 dark:bg-emerald-900/10">
          <div className="flex items-center gap-2 text-[var(--success)] font-semibold text-sm mb-3">
            <Sparkles size={16} /> Correção
          </div>
          <div className="text-sm whitespace-pre-wrap leading-relaxed">{correction}</div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <button onClick={() => setShowHistory(!showHistory)} className="btn-ghost flex items-center gap-1.5">
            <History size={14} /> {showHistory ? 'Ocultar' : 'Ver'} histórico ({history.length})
          </button>
          {showHistory && history.map((entry) => (
            <div key={entry.id} className="card mt-2">
              <p className="text-xs text-[var(--muted)] mb-1">{new Date(entry.created_at).toLocaleDateString('pt-BR')}</p>
              <p className="text-sm font-medium">{entry.prompt}</p>
              <p className="text-sm text-[var(--muted)] mt-1">{entry.user_text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
