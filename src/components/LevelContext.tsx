'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1'

export const LEVELS: { key: Level; label: string; desc: string }[] = [
  { key: 'A1', label: 'A1', desc: 'Iniciante' },
  { key: 'A2', label: 'A2', desc: 'Básico' },
  { key: 'B1', label: 'B1', desc: 'Intermediário' },
  { key: 'B2', label: 'B2', desc: 'Intermediário+' },
  { key: 'C1', label: 'C1', desc: 'Avançado' },
]

const LevelContext = createContext<{ level: Level; setLevel: (l: Level) => void }>({ level: 'A1', setLevel: () => {} })

export function LevelProvider({ children }: { children: ReactNode }) {
  const [level, setLevelState] = useState<Level>('A1')

  useEffect(() => {
    const saved = localStorage.getItem('englishup_level') as Level | null
    if (saved && LEVELS.some(l => l.key === saved)) setLevelState(saved)
  }, [])

  const setLevel = (l: Level) => {
    setLevelState(l)
    localStorage.setItem('englishup_level', l)
  }

  return <LevelContext.Provider value={{ level, setLevel }}>{children}</LevelContext.Provider>
}

export function useLevel() {
  return useContext(LevelContext)
}
