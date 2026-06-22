'use client'

type Props = {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatBubble({ role, content }: Props) {
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[80%] px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
          isUser
            ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white rounded-2xl rounded-br-md shadow-md'
            : 'bg-[var(--card)] border border-[var(--card-border)] rounded-2xl rounded-bl-md'
        }`}
      >
        {content}
      </div>
    </div>
  )
}
