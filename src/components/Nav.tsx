'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { BookOpen, MessageCircle, PenTool, Headphones, ClipboardList, BarChart3, Home, Menu, X, GraduationCap, Settings, Zap, Star, Shield } from 'lucide-react'
import { useLevel, LEVELS } from './LevelContext'
import { getAPIUsage } from '@/lib/apiUsage'
import { supabase } from '@/lib/supabase'

const links = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/vocabulario', label: 'Vocabulário', icon: BookOpen },
  { href: '/gramatica', label: 'Gramática', icon: GraduationCap },
  { href: '/conversacao', label: 'Conversação', icon: MessageCircle },
  { href: '/escrita', label: 'Escrita', icon: PenTool },
  { href: '/escuta', label: 'Escuta', icon: Headphones },
  { href: '/palavra-do-dia', label: 'Palavra', icon: Star },
  { href: '/testes', label: 'Testes', icon: ClipboardList },
  { href: '/progresso', label: 'Progresso', icon: BarChart3 },
  { href: '/configuracoes', label: 'Config', icon: Settings },
]

export default function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { level, setLevel } = useLevel()
  const [apiUsage, setApiUsage] = useState({ count: 0, limit: 14400, percentage: 0 })
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const update = () => setApiUsage(getAPIUsage())
    update()
    const interval = setInterval(update, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('user_settings').select('role').eq('user_id', user.id).single()
      if (data?.role === 'admin') setIsAdmin(true)
    }
    checkAdmin()
  }, [])

  if (pathname === '/login') return null

  return (
    <>
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--card)]/80 border-b border-[var(--card-border)]">
        <div className="container mx-auto max-w-5xl px-4">
          {/* Top bar: logo + controls + mobile menu */}
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                <GraduationCap size={16} className="text-white" />
              </div>
              <span className="font-bold gradient-text hidden sm:block">EnglishUp</span>
            </Link>

            {/* Right controls */}
            <div className="flex items-center gap-2">
              {/* Level selector */}
              <div className="flex items-center gap-0.5 bg-[var(--primary-bg)]/50 rounded-lg p-0.5">
                {LEVELS.map(({ key, label, desc }) => (
                  <button key={key} onClick={() => setLevel(key)} title={desc}
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-all ${level === key ? 'bg-[var(--primary)] text-white' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}>
                    {label}
                  </button>
                ))}
              </div>

              {/* API usage */}
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--card)] border border-[var(--card-border)]" title={`${apiUsage.count}/${apiUsage.limit} chamadas hoje`}>
                <Zap size={10} className={apiUsage.percentage > 80 ? 'text-red-500' : apiUsage.percentage > 50 ? 'text-amber-500' : 'text-emerald-500'} />
                <span className="text-[9px] font-bold text-[var(--muted)]">{apiUsage.percentage}%</span>
              </div>

              {/* Mobile menu button */}
              <button onClick={() => setOpen(!open)} className="md:hidden p-1.5 rounded-lg hover:bg-[var(--primary-bg)]">
                {open ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Desktop nav - scrollable */}
          <div className="hidden md:block -mb-px">
            <div className="flex gap-0.5 overflow-x-auto scrollbar-hide pb-1">
              {[...links, ...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: Shield }] : [])].map(({ href, label, icon: Icon }) => {
                const active = pathname === href
                return (
                  <Link key={href} href={href}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      active
                        ? 'bg-[var(--primary-bg)] text-[var(--primary)]'
                        : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--primary-bg)]/50'
                    }`}>
                    <Icon size={13} />
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile nav overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="absolute top-14 left-0 right-0 bg-[var(--card)] border-b border-[var(--card-border)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="py-2">
              {[...links, ...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: Shield }] : [])].map(({ href, label, icon: Icon }) => {
                const active = pathname === href
                return (
                  <Link key={href} href={href} onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all ${
                      active
                        ? 'bg-[var(--primary-bg)] text-[var(--primary)] border-r-4 border-[var(--primary)]'
                        : 'text-[var(--muted)] hover:bg-[var(--primary-bg)]/50'
                    }`}>
                    <Icon size={18} />
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
