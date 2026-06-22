'use client'

import { LevelProvider } from './LevelContext'
import { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return <LevelProvider>{children}</LevelProvider>
}
