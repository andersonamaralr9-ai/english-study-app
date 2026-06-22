import { getClient, getExercisePrompt, type Level } from '@/lib/claude'

export async function POST(req: Request) {
  const { type, words, count = 5, level = 'A1' } = await req.json()
  const client = getClient()

  const prompts: Record<string, string> = {
    vocabulary: `Generate ${count} multiple-choice vocabulary questions using these words: ${JSON.stringify(words)}.
Return JSON: { "questions": [{ "word": "english word", "correct": "portuguese translation", "options": ["opt1", "opt2", "opt3", "opt4"] }] }`,

    'fill-blank': `Generate ${count} fill-in-the-blank sentences for ${level} English learners.
Return JSON: { "questions": [{ "sentence": "I ___ to school every day.", "answer": "go", "options": ["go", "went", "going", "goes"], "translation": "Eu vou para a escola todo dia." }] }`,

    translation: `Generate ${count} translation exercises for ${level} English level (mix English-to-Portuguese and Portuguese-to-English).
Return JSON: { "questions": [{ "from": "english or portuguese sentence", "answer": "translation", "fromLang": "en" or "pt", "hint": "dica em português" }] }`,

    dictation: `Generate ${count} English sentences for dictation practice at ${level} level.
Return JSON: { "sentences": [{ "text": "The cat is on the table.", "translation": "O gato está na mesa." }] }`,
  }

  const prompt = prompts[type] || prompts.vocabulary

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: getExercisePrompt(level as Level) },
      { role: 'user', content: prompt },
    ],
    max_tokens: 1024,
  })

  const text = response.choices[0]?.message?.content || ''

  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const json = JSON.parse(cleaned)
    return Response.json(json)
  } catch {
    return Response.json({ error: 'Failed to parse exercise', raw: text }, { status: 500 })
  }
}
