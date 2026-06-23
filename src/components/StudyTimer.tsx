'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Clock, Play } from 'lucide-react'

export default function StudyTimer({ feature }: { feature: string }) {
  const [seconds, setSeconds] = useState(0)
  const [started, setStarted] = useState(false)
  const secondsRef = useRef(0)
  const lastSavedRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(() => {
    if (started) return
    setStarted(true)
  }, [started])

  useEffect(() => {
    (window as unknown as Record<string, () => void>).__startStudyTimer = start
    return () => { delete (window as unknown as Record<string, unknown>).__startStudyTimer }
  }, [start])

  useEffect(() => {
    if (started) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          secondsRef.current = s + 1
          return s + 1
        })
      }, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [started])

  const saveTime = useCallback(async () => {
    const totalSeconds = secondsRef.current
    const unsavedSeconds = totalSeconds - lastSavedRef.current
    if (unsavedSeconds < 30) return

    const minutes = Math.max(1, Math.floor(unsavedSeconds / 60))
    lastSavedRef.current = totalSeconds

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const today = new Date().toISOString().split('T')[0]

      const { data: existing } = await supabase
        .from('study_sessions')
        .select('id, minutes')
        .eq('user_id', user.id)
        .eq('date', today)
        .eq('feature', feature)
        .single()

      if (existing) {
        await supabase.from('study_sessions').update({ minutes: existing.minutes + minutes }).eq('id', existing.id)
      } else {
        await supabase.from('study_sessions').insert({ user_id: user.id, date: today, minutes, feature })
      }
    } catch { /* silent fail */ }
  }, [feature])

  // Auto-save every 2 minutes
  useEffect(() => {
    if (!started) return
    const autoSave = setInterval(() => { saveTime() }, 120000)
    return () => clearInterval(autoSave)
  }, [started, saveTime])

  // Save on page navigation / unmount
  useEffect(() => {
    const handler = () => { saveTime() }
    window.addEventListener('beforeunload', handler)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') saveTime()
    })
    return () => {
      saveTime()
      window.removeEventListener('beforeunload', handler)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveTime])

  const format = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
      started ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-gray-500/10 text-[var(--muted)]'
    }`}>
      {started ? <Clock size={14} /> : <Play size={14} />}
      <span className="font-mono">{format(seconds)}</span>
    </div>
  )
}

export function triggerStudyTimer() {
  const fn = (window as unknown as Record<string, (() => void) | undefined>).__startStudyTimer
  if (fn) fn()
}
