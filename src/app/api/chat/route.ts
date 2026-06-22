import { getClient, getConversationPrompt, SYSTEM_PROMPTS, type Level } from '@/lib/claude'

export async function POST(req: Request) {
  const { messages, mode, level = 'A1' } = await req.json()

  const systemPrompt = mode === 'conversation'
    ? getConversationPrompt(level as Level)
    : SYSTEM_PROMPTS.writing

  const client = getClient()

  const stream = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    max_tokens: 1024,
    stream: true,
  })

  return new Response(
    new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content
          if (text) controller.enqueue(encoder.encode(text))
        }
        controller.close()
      },
    }),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  )
}
