'use client'

import { Volume2 } from 'lucide-react'

type Props = {
  role: 'user' | 'assistant'
  content: string
  onSpeak?: () => void
}

export default function ChatBubble({ role, content, onSpeak }: Props) {
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 group`}>
      <div
        className={`max-w-[80%] px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed relative ${
          isUser
            ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white rounded-2xl rounded-br-md shadow-md'
            : 'bg-[var(--card)] border border-[var(--card-border)] rounded-2xl rounded-bl-md'
        }`}
      >
        {content}
        {onSpeak && content && (
          <button
            onClick={onSpeak}
            className="absolute -bottom-3 right-2 w-6 h-6 rounded-full bg-[var(--primary-bg)] text-[var(--primary)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--primary)] hover:text-white"
            title="Ouvir"
          >
            <Volume2 size={12} />
          </button>
        )}
      </div>
    </div>
  )
}
