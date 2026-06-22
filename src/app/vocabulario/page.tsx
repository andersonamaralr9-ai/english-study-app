'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { VocabWord } from '@/lib/supabase'
import { VOCAB_CATEGORIES } from '@/lib/constants'
import { calculateSRS, isDueForReview } from '@/lib/srs'
import Flashcard from '@/components/Flashcard'
import StudyTimer from '@/components/StudyTimer'
import { Plus, BookOpen, RotateCcw, Search, Trash2 } from 'lucide-react'

type Tab = 'list' | 'add' | 'review'

export default function VocabularioPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('list')
  const [words, setWords] = useState<VocabWord[]>([])
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [english, setEnglish] = useState('')
  const [portuguese, setPortuguese] = useState('')
  const [example, setExample] = useState('')
  const [category, setCategory] = useState('Outros')
  const [dueWords, setDueWords] = useState<VocabWord[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [filterCategory, setFilterCategory] = useState('Todas')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data } = await supabase.from('vocab_words').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      const w = (data || []) as VocabWord[]
      setWords(w)
      setDueWords(w.filter((word) => isDueForReview(word.next_review)))
      setLoading(false)
    }
    load()
  }, [router])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!english.trim() || !portuguese.trim()) return
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase.from('vocab_words').insert({
      user_id: userId, english: english.trim().toLowerCase(), portuguese: portuguese.trim().toLowerCase(),
      example: example.trim(), category, interval: 0, repetitions: 0, ease_factor: 2.5, next_review: today,
    }).select().single()
    if (!error && data) {
      const word = data as VocabWord
      setWords([word, ...words])
      setDueWords([...dueWords, word])
      setEnglish(''); setPortuguese(''); setExample('')
      setTab('list')
    }
  }

  const handleRate = async (quality: number) => {
    const word = dueWords[currentIndex]
    const result = calculateSRS(quality, word.repetitions, word.ease_factor, word.interval)
    await supabase.from('vocab_words').update({
      interval: result.interval, repetitions: result.repetitions,
      ease_factor: result.easeFactor, next_review: result.nextReview,
    }).eq('id', word.id)
    if (currentIndex + 1 < dueWords.length) setCurrentIndex(currentIndex + 1)
    else { setCurrentIndex(0); setDueWords([]); setTab('list') }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('vocab_words').delete().eq('id', id)
    setWords(words.filter((w) => w.id !== id))
    setDueWords(dueWords.filter((w) => w.id !== id))
  }

  const filteredWords = words.filter((w) => {
    if (filterCategory !== 'Todas' && w.category !== filterCategory) return false
    if (search && !w.english.includes(search.toLowerCase()) && !w.portuguese.includes(search.toLowerCase())) return false
    return true
  })

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <BookOpen size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Vocabulário</h1>
            <p className="text-xs text-[var(--muted)]">{words.length} palavras · {dueWords.length} para revisar</p>
          </div>
        </div>
        <StudyTimer feature="vocabulario" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([
          { key: 'list' as Tab, label: `Lista (${words.length})`, icon: BookOpen },
          { key: 'add' as Tab, label: 'Adicionar', icon: Plus },
          { key: 'review' as Tab, label: `Revisar (${dueWords.length})`, icon: RotateCcw },
        ]).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => { setTab(key); if (key === 'review') setCurrentIndex(0) }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === key ? 'bg-[var(--primary)] text-white shadow-md' : 'bg-[var(--card)] border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Add form */}
      {tab === 'add' && (
        <form onSubmit={handleAdd} className="card space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Inglês</label>
              <input value={english} onChange={(e) => setEnglish(e.target.value)} placeholder="hello" className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Português</label>
              <input value={portuguese} onChange={(e) => setPortuguese(e.target.value)} placeholder="olá" className="input" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Exemplo (opcional)</label>
            <input value={example} onChange={(e) => setExample(e.target.value)} placeholder="Hello, how are you?" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Categoria</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
              {VOCAB_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary w-full">Adicionar palavra</button>
        </form>
      )}

      {/* Review */}
      {tab === 'review' && (
        dueWords.length > 0 ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <span className="badge bg-[var(--primary-bg)] text-[var(--primary)]">{currentIndex + 1} de {dueWords.length}</span>
            </div>
            <Flashcard english={dueWords[currentIndex].english} portuguese={dueWords[currentIndex].portuguese} example={dueWords[currentIndex].example} onRate={handleRate} />
          </div>
        ) : (
          <div className="card text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <RotateCcw size={28} className="text-emerald-500" />
            </div>
            <p className="font-semibold">Tudo revisado!</p>
            <p className="text-sm text-[var(--muted)]">Adicione mais palavras ou volte amanhã.</p>
          </div>
        )
      )}

      {/* Word list */}
      {tab === 'list' && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[150px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="input pl-9" />
            </div>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="input w-auto">
              <option>Todas</option>
              {VOCAB_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          {filteredWords.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-[var(--muted)]">Nenhuma palavra encontrada.</p>
              <button onClick={() => setTab('add')} className="btn-primary mt-3">Adicionar primeira palavra</button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredWords.map((w) => (
                <div key={w.id} className="card flex items-center justify-between py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div>
                      <span className="font-semibold text-[var(--primary)]">{w.english}</span>
                      <span className="text-[var(--muted)] mx-2">→</span>
                      <span>{w.portuguese}</span>
                    </div>
                    <span className="badge bg-[var(--primary-bg)] text-[var(--primary)] text-[10px] hidden sm:inline-flex">{w.category}</span>
                  </div>
                  <button onClick={() => handleDelete(w.id)} className="btn-ghost p-1.5 text-[var(--danger)] hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
