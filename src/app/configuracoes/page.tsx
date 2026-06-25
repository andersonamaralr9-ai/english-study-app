'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Settings, Plus, Trash2, Save, GraduationCap, CheckCircle } from 'lucide-react'
import { DAY_NAMES } from '@/lib/constants'
import { useLevel, LEVELS } from '@/components/LevelContext'

type ClassEntry = {
  id: string
  day: number
  start_time: string
  end_time: string
  teacher: string
  type: string
}

export default function ConfiguracoesPage() {
  const router = useRouter()
  const { level, setLevel } = useLevel()
  const [userId, setUserId] = useState('')
  const [classes, setClasses] = useState<ClassEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data } = await supabase
        .from('user_classes')
        .select('*')
        .eq('user_id', user.id)
        .order('day', { ascending: true })

      if (data && data.length > 0) {
        setClasses(data as ClassEntry[])
      }
      setLoading(false)
    }
    load()
  }, [router])

  const addEntry = () => {
    setClasses([...classes, {
      id: crypto.randomUUID(),
      day: 1,
      start_time: '08:00',
      end_time: '09:00',
      teacher: '',
      type: 'Conversação',
    }])
  }

  const updateEntry = (id: string, field: string, value: string | number) => {
    setClasses(classes.map(c => c.id === id ? { ...c, [field]: value } : c))
    setSaved(false)
  }

  const removeEntry = (id: string) => {
    setClasses(classes.filter(c => c.id !== id))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)

    await supabase.from('user_classes').delete().eq('user_id', userId)

    if (classes.length > 0) {
      await supabase.from('user_classes').insert(
        classes.map(c => ({
          user_id: userId,
          day: c.day,
          start_time: c.start_time,
          end_time: c.end_time,
          teacher: c.teacher,
          type: c.type,
        }))
      )
    }

    setSaving(false)
    setSaved(true)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-500 to-slate-600 flex items-center justify-center">
          <Settings size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Configurações</h1>
          <p className="text-xs text-[var(--muted)]">Personalize seu app</p>
        </div>
      </div>

      {/* Level selection */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap size={18} className="text-[var(--primary)]" />
          <h2 className="font-bold">Nível de Estudo</h2>
        </div>
        <p className="text-sm text-[var(--muted)] mb-4">Selecione o nível que você está estudando. Isso afeta todas as atividades: conversação, gramática, testes, escrita e escuta.</p>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {LEVELS.map(({ key, label, desc }) => (
            <button key={key} onClick={() => setLevel(key)}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                level === key
                  ? 'border-[var(--primary)] bg-[var(--primary-bg)] shadow-md'
                  : 'border-[var(--card-border)] hover:border-[var(--primary)]/50'
              }`}>
              <p className={`text-xl font-bold ${level === key ? 'text-[var(--primary)]' : ''}`}>{label}</p>
              <p className="text-xs text-[var(--muted)]">{desc}</p>
              {level === key && <CheckCircle size={14} className="text-[var(--primary)] mx-auto mt-1" />}
            </button>
          ))}
        </div>
      </div>

      {/* Class schedule */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GraduationCap size={18} className="text-[var(--primary)]" />
            <h2 className="font-bold">Minhas Aulas</h2>
          </div>
          <button onClick={addEntry} className="btn-ghost flex items-center gap-1 text-sm">
            <Plus size={14} /> Adicionar aula
          </button>
        </div>

        {classes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[var(--muted)] mb-3">Nenhuma aula cadastrada.</p>
            <button onClick={addEntry} className="btn-primary">Adicionar primeira aula</button>
          </div>
        ) : (
          <div className="space-y-4">
            {classes.map((entry) => (
              <div key={entry.id} className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--primary-bg)]/30 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Dia</label>
                    <select value={entry.day} onChange={(e) => updateEntry(entry.id, 'day', Number(e.target.value))} className="input text-sm">
                      {DAY_NAMES.map((name, i) => <option key={i} value={i}>{name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Início</label>
                    <input type="time" value={entry.start_time} onChange={(e) => updateEntry(entry.id, 'start_time', e.target.value)} className="input text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Término</label>
                    <input type="time" value={entry.end_time} onChange={(e) => updateEntry(entry.id, 'end_time', e.target.value)} className="input text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Professor</label>
                    <input value={entry.teacher} onChange={(e) => updateEntry(entry.id, 'teacher', e.target.value)} placeholder="Nome" className="input text-sm" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-3">
                    <label className="block text-xs font-medium mb-1">Tipo de aula</label>
                    <select value={entry.type} onChange={(e) => updateEntry(entry.id, 'type', e.target.value)} className="input text-sm">
                      <option>Conversação</option>
                      <option>Conversação + Vocabulário</option>
                      <option>Gramática</option>
                      <option>Escuta</option>
                      <option>Geral</option>
                    </select>
                  </div>
                  <button onClick={() => removeEntry(entry.id)} className="btn-ghost p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 mt-4">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save size={16} /> {saving ? 'Salvando...' : 'Salvar'}
          </button>
          {saved && <span className="text-sm text-emerald-600">Salvo com sucesso!</span>}
        </div>
      </div>
    </div>
  )
}
