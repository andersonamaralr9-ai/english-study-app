'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ChatBubble from '@/components/ChatBubble'
import StudyTimer from '@/components/StudyTimer'
import { Send, Trash2, MessageCircle, Mic, MicOff, Volume2, VolumeX, GraduationCap } from 'lucide-react'

type Message = { role: 'user' | 'assistant'; content: string }
type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1'

const LEVELS: { key: Level; label: string; desc: string }[] = [
  { key: 'A1', label: 'A1', desc: 'Iniciante' },
  { key: 'A2', label: 'A2', desc: 'Básico' },
  { key: 'B1', label: 'B1', desc: 'Intermediário' },
  { key: 'B2', label: 'B2', desc: 'Intermediário+' },
  { key: 'C1', label: 'C1', desc: 'Avançado' },
]

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
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [userId, setUserId] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [level, setLevel] = useState<Level>('A1')
  const bottomRef = useRef<HTMLDivElement>(null)

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
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setInput(transcript)
      if (event.results[event.results.length - 1].isFinal) {
        setIsListening(false)
      }
    }

    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    setIsListening(true)
    recognition.start()
  }, [])

  const startTopic = (topic: string) => {
    setMessages([])
    sendWithText(`I want to practice: ${topic}`)
  }

  const sendWithText = async (text: string) => {
    if (!text.trim() || streaming) return

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

      if (autoSpeak && assistantContent) {
        speak(assistantContent)
      }

      await supabase.from('conversations').insert({
        user_id: userId,
        topic: messages.length === 0 ? text.trim().slice(0, 100) : 'continuation',
        messages: [...newMessages, { role: 'assistant', content: assistantContent }],
      })
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Erro ao conectar com a IA. Verifique sua API key.' }])
    } finally {
      setStreaming(false)
    }
  }

  const sendMessage = () => sendWithText(input)

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
          <div className="flex items-center gap-0.5 bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-0.5">
            {LEVELS.map(({ key, label }) => (
              <button key={key} onClick={() => { setLevel(key); if (messages.length > 0) { setMessages([]); speechSynthesis.cancel() } }}
                title={LEVELS.find(l => l.key === key)?.desc}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${level === key ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}>
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setAutoSpeak(!autoSpeak); if (autoSpeak) speechSynthesis.cancel() }}
            className={`btn-ghost p-2 ${autoSpeak ? 'text-[var(--primary)]' : 'text-[var(--muted)]'}`}
            title={autoSpeak ? 'Desativar leitura automática' : 'Ativar leitura automática'}
          >
            {autoSpeak ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          {messages.length > 0 && (
            <button onClick={() => { setMessages([]); speechSynthesis.cancel() }} className="btn-ghost p-2"><Trash2 size={16} /></button>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto card p-4 mb-3" style={{ borderRadius: '20px' }}>
        {messages.length === 0 ? (
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
            <p className="text-[var(--muted)] text-xs mb-4">Escolha um tema para começar:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
              {TOPICS.map((topic) => (
                <button
                  key={topic}
                  onClick={() => startTopic(topic)}
                  className="px-4 py-2.5 bg-[var(--primary-bg)] text-[var(--primary)] rounded-xl text-sm font-medium hover:bg-[var(--primary)]/20 transition-colors text-left"
                >
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
            isListening
              ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
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
