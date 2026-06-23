'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { BookOpen, MessageCircle, PenTool, Headphones, ClipboardList, BarChart3, Home, Menu, X, GraduationCap } from 'lucide-react'
import { useLevel, LEVELS } from './LevelContext'

const links = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/vocabulario', label: 'Vocabulário', icon: BookOpen },
  { href: '/gramatica', label: 'Gramática', icon: GraduationCap },
  { href: '/conversacao', label: 'Conversação', icon: MessageCircle },
  { href: '/escrita', label: 'Escrita', icon: PenTool },
  { href: '/escuta', label: 'Escuta', icon: Headphones },
  { href: '/testes', label: 'Testes', icon: ClipboardList },
  { href: '/progresso', label: 'Progresso', icon: BarChart3 },
]

export default function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { level, setLevel } = useLevel()

  if (pathname === '/login') return null

  return (
    <>
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--card)]/80 border-b border-[var(--card-border)]">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center">
                <GraduationCap size={20} className="text-white" />
              </div>
              <span className="font-bold text-lg gradient-text hidden sm:block">EnglishUp</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex gap-1">
              {links.map(({ href, label, icon: Icon }) => {
                const active = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-[var(--primary-bg)] text-[var(--primary)] shadow-sm'
                        : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--primary-bg)]/50'
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                )
              })}
            </div>

            {/* Level selector */}
            <div className="flex items-center gap-1 bg-[var(--primary-bg)]/50 rounded-xl p-0.5">
              <GraduationCap size={14} className="text-[var(--primary)] ml-1.5" />
              {LEVELS.map(({ key, label, desc }) => (
                <button key={key} onClick={() => setLevel(key)} title={desc}
                  className={`px-1.5 py-1 rounded-lg text-[10px] font-bold transition-all ${level === key ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Mobile menu button */}
            <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-xl hover:bg-[var(--primary-bg)]">
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile nav overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="absolute top-16 left-0 right-0 bg-[var(--card)] border-b border-[var(--card-border)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="py-2">
              {links.map(({ href, label, icon: Icon }) => {
                const active = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-6 py-3.5 text-sm font-medium transition-all ${
                      active
                        ? 'bg-[var(--primary-bg)] text-[var(--primary)] border-r-4 border-[var(--primary)]'
                        : 'text-[var(--muted)] hover:bg-[var(--primary-bg)]/50'
                    }`}
                  >
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
