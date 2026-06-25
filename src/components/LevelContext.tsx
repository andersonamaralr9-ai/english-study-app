'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1'

export const LEVELS: { key: Level; label: string; desc: string }[] = [
  { key: 'A1', label: 'A1', desc: 'Iniciante' },
  { key: 'A2', label: 'A2', desc: 'Básico' },
  { key: 'B1', label: 'B1', desc: 'Intermediário' },
  { key: 'B2', label: 'B2', desc: 'Intermediário+' },
  { key: 'C1', label: 'C1', desc: 'Avançado' },
]

const LevelContext = createContext<{ level: Level; setLevel: (l: Level) => void; loaded: boolean }>({
  level: 'A1', setLevel: () => {}, loaded: false,
})

export function LevelProvider({ children }: { children: ReactNode }) {
  const [level, setLevelState] = useState<Level>('A1')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const load = async () => {
      // First load from localStorage for instant display
      const cached = localStorage.getItem('englishup_level') as Level | null
      if (cached && LEVELS.some(l => l.key === cached)) setLevelState(cached)

      // Then sync from Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('user_settings')
            .select('level')
            .eq('user_id', user.id)
            .single()

          if (data?.level && LEVELS.some(l => l.key === data.level)) {
            setLevelState(data.level as Level)
            localStorage.setItem('englishup_level', data.level)
          }
        }
      } catch { /* user not logged in yet */ }
      setLoaded(true)
    }
    load()
  }, [])

  const setLevel = useCallback(async (l: Level) => {
    setLevelState(l)
    localStorage.setItem('englishup_level', l)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: existing } = await supabase
          .from('user_settings')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (existing) {
          await supabase.from('user_settings').update({ level: l, updated_at: new Date().toISOString() }).eq('user_id', user.id)
        } else {
          await supabase.from('user_settings').insert({ user_id: user.id, level: l })
        }
      }
    } catch { /* silent */ }
  }, [])

  return <LevelContext.Provider value={{ level, setLevel, loaded }}>{children}</LevelContext.Provider>
}

export function useLevel() {
  return useContext(LevelContext)
}
