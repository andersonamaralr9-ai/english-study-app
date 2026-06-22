'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Clock } from 'lucide-react'

export default function StudyTimer({ feature }: { feature: string }) {
  const [seconds, setSeconds] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const savedRef = useRef(false)

  useEffect(() => {
    intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const save = useCallback(async () => {
    if (seconds < 30 || savedRef.current) return
    savedRef.current = true
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    const minutes = Math.max(1, Math.floor(seconds / 60))

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
  }, [seconds, feature])

  useEffect(() => {
    const handler = () => { save() }
    window.addEventListener('beforeunload', handler)
    return () => { save(); window.removeEventListener('beforeunload', handler) }
  }, [save])

  const format = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
      <Clock size={14} />
      <span className="font-mono">{format(seconds)}</span>
    </div>
  )
}
