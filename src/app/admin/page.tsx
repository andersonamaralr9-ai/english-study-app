'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Shield, Users, TrendingUp, Clock, BookOpen, Trophy, MessageCircle, PenTool, Download, ChevronDown, ChevronUp, Search, UserPlus, Award, AlertCircle, Upload } from 'lucide-react'

type UserOverview = {
  user_id: string
  email: string
  joined_at: string
  name: string
  level: string
  role: string
  active: boolean
  vocab_count: number
  mastered_count: number
  total_minutes: number
  test_count: number
  conversation_count: number
  writing_count: number
  avg_test_score: number
  last_study_date: string | null
}

type View = 'dashboard' | 'users' | 'reports' | 'invite'

export default function AdminPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserOverview[]>([])
  const [view, setView] = useState<View>('dashboard')
  const [search, setSearch] = useState('')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState('user')
  const [inviteMsg, setInviteMsg] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ email: string; tempPassword: string } | null>(null)
  const [currentUserId, setCurrentUserId] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'total_minutes' | 'vocab_count' | 'avg_test_score'>('total_minutes')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: settings } = await supabase
        .from('user_settings')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (!settings || settings.role !== 'admin') {
        router.push('/')
        return
      }

      setIsAdmin(true)
      setCurrentUserId(user.id)

      const { data } = await supabase
        .from('admin_user_overview')
        .select('*')

      setUsers((data || []) as UserOverview[])
      setLoading(false)
    }
    load()
  }, [router])

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    await supabase.from('user_settings').update({ role: newRole }).eq('user_id', userId)
    setUsers(users.map(u => u.user_id === userId ? { ...u, role: newRole } : u))
  }

  const toggleActive = async (userId: string, currentActive: boolean) => {
    await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle-active', userId, active: !currentActive, adminUserId: currentUserId }),
    })
    setUsers(users.map(u => u.user_id === userId ? { ...u, active: !currentActive } : u))
  }

  const deleteUser = async (userId: string, email: string) => {
    if (!confirm(`Tem certeza que deseja EXCLUIR o usuário ${email}? Todos os dados serão perdidos.`)) return
    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', userId, adminUserId: currentUserId }),
    })
    const data = await res.json()
    if (data.success) setUsers(users.filter(u => u.user_id !== userId))
    else alert(data.error || 'Erro ao excluir')
  }

  const updateName = async (userId: string, name: string) => {
    await supabase.from('user_settings').update({ name }).eq('user_id', userId)
    setUsers(users.map(u => u.user_id === userId ? { ...u, name } : u))
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    const { error } = await supabase.auth.admin.createUser({
      email: inviteEmail.trim(),
      email_confirm: true,
    }).catch(() => ({ error: { message: 'Use o Supabase Dashboard para convidar usuários (Authentication > Users > Invite)' } }))

    if (error) {
      setInviteMsg(error.message || 'Para convidar, vá em Supabase Dashboard > Authentication > Users > Invite User')
    } else {
      setInviteMsg(`Convite enviado para ${inviteEmail}!`)
      setInviteEmail('')
    }
  }

  const exportCSV = () => {
    const headers = ['Nome', 'Email', 'Nível', 'Role', 'Ativo', 'Vocabulário', 'Dominadas', 'Min. Estudo', 'Testes', 'Média Testes', 'Conversas', 'Escritas', 'Último Estudo', 'Cadastro']
    const rows = filteredUsers.map(u => [
      u.name || '-', u.email, u.level, u.role, u.active ? 'Sim' : 'Não',
      u.vocab_count, u.mastered_count, u.total_minutes, u.test_count,
      Math.round(u.avg_test_score) + '%', u.conversation_count, u.writing_count,
      u.last_study_date || '-', new Date(u.joined_at).toLocaleDateString('pt-BR'),
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `englishup-relatorio-${new Date().toISOString().split('T')[0]}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
  if (!isAdmin) return null

  const activeUsers = users.filter(u => u.active)
  const totalMinutes = users.reduce((s, u) => s + u.total_minutes, 0)
  const totalWords = users.reduce((s, u) => s + u.vocab_count, 0)
  const avgScore = users.length > 0 ? Math.round(users.reduce((s, u) => s + u.avg_test_score, 0) / users.length) : 0
  const recentlyActive = users.filter(u => {
    if (!u.last_study_date) return false
    const diff = (Date.now() - new Date(u.last_study_date).getTime()) / 86400000
    return diff <= 7
  })
  const inactive7days = users.filter(u => {
    if (!u.last_study_date) return true
    const diff = (Date.now() - new Date(u.last_study_date).getTime()) / 86400000
    return diff > 7
  })

  const filteredUsers = users
    .filter(u => {
      if (!search) return true
      return u.email.toLowerCase().includes(search.toLowerCase()) || u.name.toLowerCase().includes(search.toLowerCase())
    })
    .sort((a, b) => {
      const va = a[sortBy] ?? 0
      const vb = b[sortBy] ?? 0
      if (typeof va === 'string') return sortDir === 'asc' ? (va as string).localeCompare(vb as string) : (vb as string).localeCompare(va as string)
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number)
    })

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortDir('desc') }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Painel Admin</h1>
            <p className="text-xs text-[var(--muted)]">{users.length} usuários • {activeUsers.length} ativos</p>
          </div>
        </div>
        <button onClick={exportCSV} className="btn-ghost flex items-center gap-1.5 text-sm">
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      {/* View tabs */}
      <div className="flex gap-2">
        {([
          { key: 'dashboard' as View, label: 'Visão Geral', icon: TrendingUp },
          { key: 'users' as View, label: 'Usuários', icon: Users },
          { key: 'reports' as View, label: 'Relatórios', icon: Trophy },
          { key: 'invite' as View, label: 'Convidar', icon: UserPlus },
        ]).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setView(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              view === key ? 'bg-[var(--primary)] text-white shadow-md' : 'bg-[var(--card)] border border-[var(--card-border)] text-[var(--muted)]'
            }`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {view === 'dashboard' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Users, value: users.length, label: 'Total Usuários', color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { icon: Clock, value: totalMinutes, label: 'Min. Totais', color: 'text-violet-500', bg: 'bg-violet-500/10' },
              { icon: BookOpen, value: totalWords, label: 'Palavras Total', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { icon: Trophy, value: `${avgScore}%`, label: 'Média Testes', color: 'text-amber-500', bg: 'bg-amber-500/10' },
            ].map(({ icon: Icon, value, label, color, bg }) => (
              <div key={label} className="card">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-2`}>
                  <Icon size={20} className={color} />
                </div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-[var(--muted)]">{label}</p>
              </div>
            ))}
          </div>

          {/* Activity alerts */}
          {inactive7days.length > 0 && (
            <div className="card border-amber-500/30">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} className="text-amber-500" />
                <h3 className="font-bold text-sm">Inativos há +7 dias ({inactive7days.length})</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {inactive7days.map(u => (
                  <span key={u.user_id} className="badge bg-amber-500/10 text-amber-700 dark:text-amber-400">
                    {u.name || u.email.split('@')[0]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Top 5 ranking */}
          <div className="card">
            <h3 className="font-bold mb-3">Ranking — Mais Horas de Estudo</h3>
            <div className="space-y-2">
              {[...users].sort((a, b) => b.total_minutes - a.total_minutes).slice(0, 5).map((u, i) => (
                <div key={u.user_id} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--primary-bg)]/30">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-gray-400 text-white' : i === 2 ? 'bg-amber-700 text-white' : 'bg-[var(--card-border)] text-[var(--muted)]'}`}>{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{u.name || u.email.split('@')[0]}</p>
                    <p className="text-[10px] text-[var(--muted)]">{u.level} • {u.vocab_count} palavras • {u.mastered_count} dominadas</p>
                  </div>
                  <span className="text-sm font-bold text-[var(--primary)]">{u.total_minutes} min</span>
                </div>
              ))}
            </div>
          </div>

          {/* Level distribution */}
          <div className="card">
            <h3 className="font-bold mb-3">Distribuição por Nível</h3>
            <div className="flex gap-2">
              {['A1', 'A2', 'B1', 'B2', 'C1'].map(lvl => {
                const count = users.filter(u => u.level === lvl).length
                return (
                  <div key={lvl} className="flex-1 text-center p-3 rounded-xl bg-[var(--primary-bg)]/30">
                    <p className="text-xl font-bold text-[var(--primary)]">{count}</p>
                    <p className="text-xs text-[var(--muted)]">{lvl}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Users list */}
      {view === 'users' && (
        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou email..." className="input pl-9" />
          </div>

          {/* Sort buttons */}
          <div className="flex gap-2 text-xs">
            <span className="text-[var(--muted)]">Ordenar:</span>
            {([
              { key: 'name' as const, label: 'Nome' },
              { key: 'total_minutes' as const, label: 'Tempo' },
              { key: 'vocab_count' as const, label: 'Palavras' },
              { key: 'avg_test_score' as const, label: 'Média' },
            ]).map(({ key, label }) => (
              <button key={key} onClick={() => toggleSort(key)}
                className={`flex items-center gap-0.5 px-2 py-1 rounded-lg ${sortBy === key ? 'bg-[var(--primary-bg)] text-[var(--primary)] font-medium' : 'text-[var(--muted)]'}`}>
                {label} {sortBy === key && (sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
              </button>
            ))}
          </div>

          {filteredUsers.map(u => (
            <div key={u.user_id} className="card">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedUser(expandedUser === u.user_id ? null : u.user_id)}>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${u.active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{u.name || u.email.split('@')[0]}</p>
                      {u.role === 'admin' && <span className="badge bg-red-500/10 text-red-600 text-[9px]">Admin</span>}
                      <span className="badge bg-[var(--primary-bg)] text-[var(--primary)] text-[9px]">{u.level}</span>
                    </div>
                    <p className="text-[10px] text-[var(--muted)]">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
                  <span>{u.total_minutes} min</span>
                  <span>{u.vocab_count} palavras</span>
                  <span>{Math.round(u.avg_test_score)}%</span>
                  {expandedUser === u.user_id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>

              {expandedUser === u.user_id && (
                <div className="mt-4 pt-4 border-t border-[var(--card-border)] space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    {[
                      { label: 'Vocabulário', value: u.vocab_count, icon: BookOpen },
                      { label: 'Dominadas', value: u.mastered_count, icon: Award },
                      { label: 'Conversas', value: u.conversation_count, icon: MessageCircle },
                      { label: 'Escritas', value: u.writing_count, icon: PenTool },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="p-2 rounded-lg bg-[var(--primary-bg)]/30">
                        <Icon size={14} className="mx-auto mb-1 text-[var(--primary)]" />
                        <p className="text-lg font-bold">{value}</p>
                        <p className="text-[10px] text-[var(--muted)]">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-[var(--muted)]">Nome</label>
                      <input defaultValue={u.name} onBlur={(e) => updateName(u.user_id, e.target.value)} className="input text-sm" placeholder="Nome do colaborador" />
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => toggleRole(u.user_id, u.role)}
                      className={`btn-ghost text-xs ${u.role === 'admin' ? 'text-red-600' : 'text-[var(--primary)]'}`}>
                      {u.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                    </button>
                    <button onClick={() => toggleActive(u.user_id, u.active)}
                      className={`btn-ghost text-xs ${u.active ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {u.active ? 'Inativar' : 'Reativar'}
                    </button>
                    <button onClick={() => deleteUser(u.user_id, u.email)}
                      className="btn-ghost text-xs text-red-600">
                      Excluir permanentemente
                    </button>
                  </div>

                  <p className="text-[10px] text-[var(--muted)]">
                    Cadastro: {new Date(u.joined_at).toLocaleDateString('pt-BR')} •
                    Último estudo: {u.last_study_date ? new Date(u.last_study_date).toLocaleDateString('pt-BR') : 'Nunca'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reports */}
      {view === 'reports' && (
        <div className="space-y-5">
          {/* Engagement report */}
          <div className="card">
            <h3 className="font-bold mb-3">Engajamento</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <p className="text-2xl font-bold text-emerald-600">{recentlyActive.length}</p>
                <p className="text-xs text-[var(--muted)]">Ativos esta semana</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10">
                <p className="text-2xl font-bold text-amber-600">{inactive7days.length}</p>
                <p className="text-xs text-[var(--muted)]">Inativos +7 dias</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10">
                <p className="text-2xl font-bold text-blue-600">{users.length > 0 ? Math.round((recentlyActive.length / users.length) * 100) : 0}%</p>
                <p className="text-xs text-[var(--muted)]">Taxa de engajamento</p>
              </div>
            </div>
          </div>

          {/* Ranking: vocabulary */}
          <div className="card">
            <h3 className="font-bold mb-3">Ranking — Vocabulário</h3>
            <div className="space-y-2">
              {[...users].sort((a, b) => b.vocab_count - a.vocab_count).slice(0, 10).map((u, i) => (
                <div key={u.user_id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[var(--muted)] w-5">{i + 1}</span>
                  <span className="text-sm flex-1">{u.name || u.email.split('@')[0]}</span>
                  <span className="text-sm font-bold text-[var(--primary)]">{u.vocab_count} palavras</span>
                  <span className="text-xs text-emerald-600">{u.mastered_count} dominadas</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ranking: test scores */}
          <div className="card">
            <h3 className="font-bold mb-3">Ranking — Média de Testes</h3>
            <div className="space-y-2">
              {[...users].filter(u => u.test_count > 0).sort((a, b) => b.avg_test_score - a.avg_test_score).slice(0, 10).map((u, i) => (
                <div key={u.user_id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[var(--muted)] w-5">{i + 1}</span>
                  <span className="text-sm flex-1">{u.name || u.email.split('@')[0]}</span>
                  <span className="text-sm font-bold">{Math.round(u.avg_test_score)}%</span>
                  <span className="text-xs text-[var(--muted)]">{u.test_count} testes</span>
                </div>
              ))}
              {users.filter(u => u.test_count > 0).length === 0 && <p className="text-sm text-[var(--muted)]">Nenhum teste realizado ainda.</p>}
            </div>
          </div>

          {/* Ranking: conversations */}
          <div className="card">
            <h3 className="font-bold mb-3">Ranking — Conversações com IA</h3>
            <div className="space-y-2">
              {[...users].sort((a, b) => b.conversation_count - a.conversation_count).slice(0, 10).map((u, i) => (
                <div key={u.user_id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[var(--muted)] w-5">{i + 1}</span>
                  <span className="text-sm flex-1">{u.name || u.email.split('@')[0]}</span>
                  <span className="text-sm font-bold text-emerald-600">{u.conversation_count} conversas</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={exportCSV} className="btn-primary w-full flex items-center justify-center gap-2">
            <Download size={16} /> Exportar Relatório Completo (CSV)
          </button>
        </div>
      )}

      {/* Invite */}
      {view === 'invite' && (
        <InviteSection currentUserId={currentUserId} onRefresh={async () => {
          const { data } = await supabase.from('admin_user_overview').select('*')
          if (data) setUsers(data as UserOverview[])
        }} />
      )}
    </div>
  )
}

// Invite Section Component
function InviteSection({ currentUserId, onRefresh }: { currentUserId: string; onRefresh: () => void }) {
  const [tab, setTab] = useState<'single' | 'bulk'>('single')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('user')
  const [sendEmail, setSendEmail] = useState(true)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [result, setResult] = useState<{ email: string; tempPassword?: string; method: string } | null>(null)
  const [bulkText, setBulkText] = useState('')
  const [bulkResults, setBulkResults] = useState<{ email: string; status: string; tempPassword?: string }[]>([])
  const [bulkDone, setBulkDone] = useState(false)

  const handleSingle = async () => {
    if (!email.trim()) return
    setLoading(true); setMsg(''); setResult(null)
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', email, name, role, sendEmail, adminUserId: currentUserId }),
      })
      const data = await res.json()
      if (data.error) { setMsg(data.error) }
      else { setResult(data); setEmail(''); setName(''); onRefresh() }
    } catch { setMsg('Erro ao criar usuário.') }
    setLoading(false)
  }

  const handleBulk = async () => {
    const lines = bulkText.trim().split('\n').filter(l => l.trim())
    const users = lines.map(line => {
      const parts = line.split(/[,;\t]/).map(p => p.trim())
      return { email: parts[0] || '', name: parts[1] || '' }
    }).filter(u => u.email.includes('@'))

    if (users.length === 0) { setMsg('Nenhum email válido encontrado.'); return }

    setLoading(true); setMsg(''); setBulkResults([]); setBulkDone(false)
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk', users, sendEmail, adminUserId: currentUserId }),
      })
      const data = await res.json()
      if (data.results) { setBulkResults(data.results); setBulkDone(true); onRefresh() }
      else { setMsg(data.error || 'Erro') }
    } catch { setMsg('Erro ao importar.') }
    setLoading(false)
  }

  const exportBulkResults = () => {
    const csv = ['Email,Status,Senha Temporária', ...bulkResults.map(r => `${r.email},${r.status},${r.tempPassword || '-'}`)].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a') as HTMLAnchorElement
    a.href = url; a.download = 'usuarios-criados.csv'; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Tab toggle */}
      <div className="flex gap-2">
        <button onClick={() => setTab('single')} className={`flex-1 py-2 rounded-xl text-sm font-medium ${tab === 'single' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--card)] border border-[var(--card-border)]'}`}>
          <UserPlus size={14} className="inline mr-1" /> Adicionar um
        </button>
        <button onClick={() => setTab('bulk')} className={`flex-1 py-2 rounded-xl text-sm font-medium ${tab === 'bulk' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--card)] border border-[var(--card-border)]'}`}>
          <Upload size={14} className="inline mr-1" /> Importar lista
        </button>
      </div>

      {/* Email toggle */}
      <div className="card flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Enviar email de convite</p>
          <p className="text-xs text-[var(--muted)]">{sendEmail ? 'O colaborador recebe um email com link para definir a senha' : 'Você recebe uma senha temporária para compartilhar manualmente'}</p>
        </div>
        <button onClick={() => setSendEmail(!sendEmail)}
          className={`w-12 h-6 rounded-full transition-colors ${sendEmail ? 'bg-[var(--primary)]' : 'bg-gray-300 dark:bg-gray-600'}`}>
          <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${sendEmail ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {/* Single invite */}
      {tab === 'single' && (
        <div className="card space-y-4">
          <h3 className="font-bold">Adicionar Colaborador</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Email *</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colaborador@empresa.com" className="input" type="email" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Nome</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" className="input" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Perfil</label>
            <div className="flex gap-2">
              <button onClick={() => setRole('user')} className={`flex-1 p-2 rounded-xl border text-sm font-medium ${role === 'user' ? 'border-[var(--primary)] bg-[var(--primary-bg)] text-[var(--primary)]' : 'border-[var(--card-border)]'}`}>Colaborador</button>
              <button onClick={() => setRole('admin')} className={`flex-1 p-2 rounded-xl border text-sm font-medium ${role === 'admin' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600' : 'border-[var(--card-border)]'}`}>Admin</button>
            </div>
          </div>
          <button onClick={handleSingle} disabled={loading || !email.trim()} className="btn-primary w-full flex items-center justify-center gap-2">
            <UserPlus size={16} /> {loading ? 'Criando...' : sendEmail ? 'Enviar convite por email' : 'Criar com senha temporária'}
          </button>
        </div>
      )}

      {/* Bulk import */}
      {tab === 'bulk' && (
        <div className="card space-y-4">
          <h3 className="font-bold">Importar Lista de Colaboradores</h3>
          <p className="text-xs text-[var(--muted)]">Cole a lista com um email por linha. Opcionalmente, adicione o nome após vírgula ou tab.</p>
          <div className="p-3 rounded-lg bg-[var(--primary-bg)]/50 text-xs text-[var(--muted)] font-mono">
            joao@empresa.com, João Silva<br />
            maria@empresa.com, Maria Santos<br />
            pedro@empresa.com
          </div>
          <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)}
            placeholder="joao@empresa.com, João Silva&#10;maria@empresa.com, Maria Santos&#10;pedro@empresa.com"
            className="input resize-none font-mono text-sm" rows={8} />
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>{bulkText.trim().split('\n').filter(l => l.includes('@')).length} emails detectados</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <span>Ou faça upload:</span>
              <input type="file" accept=".csv,.txt" className="text-xs" onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = (ev) => { setBulkText(ev.target?.result as string || '') }
                reader.readAsText(file)
              }} />
            </label>
          </div>
          <button onClick={handleBulk} disabled={loading || !bulkText.trim()} className="btn-primary w-full flex items-center justify-center gap-2">
            <Upload size={16} /> {loading ? 'Importando...' : sendEmail ? 'Enviar convites por email' : 'Criar todos com senha temporária'}
          </button>
        </div>
      )}

      {/* Messages */}
      {msg && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">{msg}</div>}

      {/* Single result */}
      {result && (
        <div className="card border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-900/10 space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 font-bold"><UserPlus size={16} /> {result.method === 'email' ? 'Convite enviado!' : 'Usuário criado!'}</div>
          <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-2">
            <div className="flex justify-between text-sm"><span className="text-[var(--muted)]">Email:</span><span className="font-medium">{result.email}</span></div>
            {result.tempPassword && <div className="flex justify-between text-sm"><span className="text-[var(--muted)]">Senha temporária:</span><span className="font-mono font-bold text-[var(--primary)]">{result.tempPassword}</span></div>}
            {result.method === 'email' && <p className="text-xs text-emerald-600">O colaborador receberá um email com link para definir a senha.</p>}
          </div>
          {result.tempPassword && (
            <button onClick={() => {
              navigator.clipboard.writeText(`Email: ${result.email}\nSenha: ${result.tempPassword}\nAcesse: https://english-amaral.vercel.app`)
              setMsg('Copiado!'); setTimeout(() => setMsg(''), 2000)
            }} className="btn-ghost w-full text-sm">Copiar credenciais</button>
          )}
        </div>
      )}

      {/* Bulk results */}
      {bulkDone && bulkResults.length > 0 && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Resultado da Importação</h3>
            {!sendEmail && <button onClick={exportBulkResults} className="btn-ghost text-xs flex items-center gap-1"><Download size={12} /> Exportar senhas</button>}
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {bulkResults.map((r, i) => (
              <div key={i} className={`flex items-center justify-between p-2 rounded-lg text-xs ${r.status === 'Criado' || r.status.includes('Convite') ? 'bg-emerald-50 dark:bg-emerald-900/10' : 'bg-red-50 dark:bg-red-900/10'}`}>
                <span className="font-medium">{r.email}</span>
                <span className={r.status === 'Criado' || r.status.includes('Convite') ? 'text-emerald-600' : 'text-red-600'}>{r.status}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--muted)]">
            {bulkResults.filter(r => r.status === 'Criado' || r.status.includes('Convite')).length} de {bulkResults.length} criados com sucesso
          </p>
        </div>
      )}
    </div>
  )
}
