'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Conversation } from '@/lib/supabase'
import ChatBubble from '@/components/ChatBubble'
import StudyTimer from '@/components/StudyTimer'
import { Send, Trash2, MessageCircle, Mic, MicOff, Volume2, VolumeX, GraduationCap, History, Plus, ChevronLeft } from 'lucide-react'
import { useLevel, LEVELS } from '@/components/LevelContext'
import { triggerStudyTimer } from '@/components/StudyTimer'

type Message = { role: 'user' | 'assistant'; content: string }
type View = 'topics' | 'chat' | 'history'

const TOPICS = [
  'Me apresentar em inglês',
  'Falar sobre minha família',
  'Pedir comida em um restaurante',
  'Perguntar direções na rua',
  'Falar sobre meu trabalho',
  'Descrever minha rotina diária',
  'Fazer compras no supermercado',
  'Falar sobre o clima',
]

export default function ConversacaoPage() {
  const router = useRouter()
  const [view, setView] = useState<View>('topics')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [userId, setUserId] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [history, setHistory] = useState<Conversation[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const { level } = useLevel()
  const bottomRef = useRef<HTMLDivElement>(null)
  const autoSendRef = useRef<string | null>(null)

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
    }
    check()
  }, [router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!isListening && autoSendRef.current && !streaming) {
      const text = autoSendRef.current
      autoSendRef.current = null
      sendWithText(text)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening])

  const speak = useCallback((text: string) => {
    speechSynthesis.cancel()
    const clean = text.replace(/\[Correction:.*?\]/g, '').replace(/\[.*?\]/g, '').trim()
    if (!clean) return
    const utterance = new SpeechSynthesisUtterance(clean)
    utterance.lang = 'en-US'
    utterance.rate = 0.85
    speechSynthesis.speak(utterance)
  }, [])

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const W = window as any
    const SpeechRecognitionCtor = W.SpeechRecognition || W.webkitSpeechRecognition
    if (!SpeechRecognitionCtor) { alert('Seu navegador não suporta reconhecimento de voz. Use Chrome.'); return }
    const recognition = new SpeechRecognitionCtor()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = false
    recognition.onresult = (event: { results: { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } } }) => {
      let transcript = ''
      for (let i = 0; i < event.results.length; i++) { transcript += event.results[i][0].transcript }
      setInput(transcript)
      if (event.results[event.results.length - 1].isFinal) {
        setIsListening(false)
        if (transcript.trim()) autoSendRef.current = transcript.trim()
      }
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    setIsListening(true)
    recognition.start()
  }, [])

  const loadHistory = async () => {
    setLoadingHistory(true)
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)
    setHistory((data || []) as Conversation[])
    setLoadingHistory(false)
    setView('history')
  }

  const continueConversation = (convo: Conversation) => {
    setConversationId(convo.id)
    setMessages(convo.messages as Message[])
    setView('chat')
  }

  const startNew = () => {
    setConversationId(null)
    setMessages([])
    setView('topics')
  }

  const startTopic = (topic: string) => {
    setConversationId(null)
    setMessages([])
    setView('chat')
    sendWithText(`I want to practice: ${topic}`)
  }

  const deleteConversation = async (id: string) => {
    await supabase.from('conversations').delete().eq('id', id)
    setHistory(history.filter(h => h.id !== id))
  }

  const sendWithText = async (text: string) => {
    if (!text.trim() || streaming) return
    if (view !== 'chat') setView('chat')

    triggerStudyTimer()
    const userMsg: Message = { role: 'user', content: text.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setStreaming(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, mode: 'conversation', level }),
      })

      const reader = res.body?.getReader()
      if (!reader) return

      let assistantContent = ''
      setMessages([...newMessages, { role: 'assistant', content: '' }])

      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantContent += decoder.decode(value, { stream: true })
        setMessages([...newMessages, { role: 'assistant', content: assistantContent }])
      }

      if (autoSpeak && assistantContent) speak(assistantContent)

      const fullMessages = [...newMessages, { role: 'assistant' as const, content: assistantContent }]

      if (conversationId) {
        await supabase.from('conversations').update({ messages: fullMessages }).eq('id', conversationId)
      } else {
        const { data } = await supabase.from('conversations').insert({
          user_id: userId,
          topic: text.trim().slice(0, 100),
          messages: fullMessages,
        }).select('id').single()
        if (data) setConversationId(data.id)
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Erro ao conectar com a IA. Verifique sua API key.' }])
    } finally {
      setStreaming(false)
    }
  }

  const sendMessage = () => sendWithText(input)

  // History view
  if (view === 'history') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setView(messages.length > 0 ? 'chat' : 'topics')} className="btn-ghost p-2"><ChevronLeft size={18} /></button>
            <div>
              <h1 className="text-xl font-bold">Histórico</h1>
              <p className="text-xs text-[var(--muted)]">{history.length} conversas</p>
            </div>
          </div>
          <button onClick={startNew} className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus size={14} /> Nova conversa
          </button>
        </div>

        {loadingHistory ? (
          <div className="flex items-center justify-center h-32"><div className="spinner" /></div>
        ) : history.length === 0 ? (
          <div className="card text-center py-12">
            <MessageCircle size={32} className="mx-auto mb-3 text-[var(--muted)] opacity-30" />
            <p className="text-[var(--muted)]">Nenhuma conversa ainda.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((convo) => {
              const msgCount = (convo.messages as Message[]).length
              const lastMsg = (convo.messages as Message[])[msgCount - 1]
              const date = new Date(convo.created_at)
              return (
                <div key={convo.id} className="card card-interactive flex items-center gap-3 cursor-pointer" onClick={() => continueConversation(convo)}>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                    <MessageCircle size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{convo.topic || 'Conversa'}</p>
                    <p className="text-xs text-[var(--muted)] truncate">{lastMsg?.content.slice(0, 80) || '...'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-[var(--muted)]">{date.toLocaleDateString('pt-BR')} {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-[10px] text-[var(--muted)]">• {msgCount} msgs</span>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteConversation(convo.id) }} className="btn-ghost p-1.5 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100">
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <MessageCircle size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Conversação</h1>
            <p className="text-xs text-[var(--muted)]">Pratique inglês com IA — fale ou digite</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StudyTimer feature="conversacao" />
          <button onClick={loadHistory} className="btn-ghost p-2" title="Histórico">
            <History size={16} />
          </button>
          <button
            onClick={() => { setAutoSpeak(!autoSpeak); if (autoSpeak) speechSynthesis.cancel() }}
            className={`btn-ghost p-2 ${autoSpeak ? 'text-[var(--primary)]' : 'text-[var(--muted)]'}`}
            title={autoSpeak ? 'Desativar leitura automática' : 'Ativar leitura automática'}
          >
            {autoSpeak ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          {messages.length > 0 && (
            <>
              <button onClick={startNew} className="btn-ghost p-2 text-emerald-600" title="Nova conversa"><Plus size={16} /></button>
              <button onClick={() => { setMessages([]); setConversationId(null); speechSynthesis.cancel(); setView('topics') }} className="btn-ghost p-2" title="Limpar"><Trash2 size={16} /></button>
            </>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto card p-4 mb-3" style={{ borderRadius: '20px' }}>
        {view === 'topics' && messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-4">
              <MessageCircle size={28} className="text-white" />
            </div>
            <p className="font-semibold mb-1">Vamos conversar!</p>
            <p className="text-[var(--muted)] text-sm mb-2">Fale pelo microfone ou digite — a IA corrige seus erros</p>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap size={14} className="text-[var(--primary)]" />
              <span className="text-sm text-[var(--muted)]">Nível: <strong className="text-[var(--primary)]">{level}</strong> — {LEVELS.find(l => l.key === level)?.desc}</span>
            </div>

            {/* History shortcut */}
            <button onClick={loadHistory} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--card)] border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] mb-6 transition-colors">
              <History size={14} /> Ver conversas anteriores
            </button>

            <p className="text-[var(--muted)] text-xs mb-4">Ou escolha um tema:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
              {TOPICS.map((topic) => (
                <button key={topic} onClick={() => startTopic(topic)}
                  className="px-4 py-2.5 bg-[var(--primary-bg)] text-[var(--primary)] rounded-xl text-sm font-medium hover:bg-[var(--primary)]/20 transition-colors text-left">
                  {topic}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <ChatBubble key={i} role={msg.role} content={msg.content} onSpeak={msg.role === 'assistant' ? () => speak(msg.content) : undefined} />
            ))}
            {streaming && messages[messages.length - 1]?.content === '' && (
              <div className="flex justify-start mb-3">
                <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-[var(--card)] border border-[var(--card-border)]">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-[var(--muted)] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-[var(--muted)] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-[var(--muted)] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <button
          onClick={isListening ? () => setIsListening(false) : startListening}
          disabled={streaming}
          className={`flex items-center justify-center rounded-2xl px-4 transition-all ${
            isListening ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
              : 'bg-[var(--card)] border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]'
          }`}
          title={isListening ? 'Parar de ouvir' : 'Falar em inglês'}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder={isListening ? 'Ouvindo... fale em inglês' : 'Type or speak in English...'}
          className="input flex-1"
          style={{ borderRadius: '16px', padding: '0.875rem 1.25rem' }}
          disabled={streaming}
        />
        <button
          onClick={sendMessage}
          disabled={streaming || !input.trim()}
          className="btn-primary px-4 flex items-center justify-center"
          style={{ borderRadius: '16px' }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
