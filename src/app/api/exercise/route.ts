import { getClient, getExercisePrompt, type Level } from '@/lib/claude'

export async function POST(req: Request) {
  const { type, words, count = 5, level = 'A1' } = await req.json()
  const client = getClient()

  const prompts: Record<string, string> = {
    vocabulary: `Generate ${count} multiple-choice vocabulary questions using these words: ${JSON.stringify(words)}.
Return JSON: { "questions": [{ "word": "english word", "correct": "portuguese translation", "options": ["opt1", "opt2", "opt3", "opt4"] }] }`,

    'fill-blank': `Generate ${count} fill-in-the-blank sentences for ${level} English learners.
For each question, include an explanation in Portuguese of WHY the answer is correct and a grammar tip.
Return JSON: { "questions": [{ "sentence": "I ___ to school every day.", "answer": "go", "options": ["go", "went", "going", "goes"], "translation": "Eu vou para a escola todo dia.", "explanation": "Usamos 'go' porque é presente simples com 'I'. Com he/she usaríamos 'goes'.", "tip": "Present simple: I/you/we/they + verbo base, he/she/it + verbo+s" }] }`,

    translation: `Generate ${count} translation exercises for ${level} English level (mix English-to-Portuguese and Portuguese-to-English).
For each question, include an explanation in Portuguese about the grammar or vocabulary used and a learning tip.
Return JSON: { "questions": [{ "from": "english or portuguese sentence", "answer": "translation", "fromLang": "en" or "pt", "hint": "dica em português", "explanation": "Explicação detalhada em português do porquê da tradução", "tip": "Dica de gramática ou vocabulário relevante" }] }`,

    dictation: `Generate ${count} English sentences for dictation practice at ${level} level.
Return JSON: { "sentences": [{ "text": "The cat is on the table.", "translation": "O gato está na mesa." }] }`,

    'word-deep': `Generate ${count} varied activities to deeply learn the word "${words[0]?.english}" (Portuguese: "${words[0]?.portuguese}") at ${level} level.

Mix these activity types:
1. "context" - Show the word in different contexts/situations, ask which usage is correct
2. "fill-blank" - Fill in the blank with the correct form of the word
3. "translate" - Translate a sentence using the word
4. "tense" - Use the word in different tenses (past, present, future)
5. "synonym" - Identify synonyms or antonyms
6. "sentence" - Create or complete a sentence using the word
7. "context" - Choose the correct meaning based on context

For EVERY activity, include:
- A detailed "explanation" in Portuguese explaining why the answer is correct, the grammar rule, and when to use it
- A "tip" in Portuguese with a practical memory trick or usage note

Return JSON: { "activities": [{ "type": "context|fill-blank|translate|tense|synonym|sentence", "question": "the question text", "answer": "correct answer", "options": ["opt1", "opt2", "opt3", "opt4"] or [] for free-text, "explanation": "Explicação detalhada em português sobre por que esta é a resposta correta, incluindo regra gramatical", "tip": "Dica prática em português para memorizar ou usar esta palavra" }] }`,
  }

  const prompt = prompts[type] || prompts.vocabulary

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: getExercisePrompt(level as Level) },
      { role: 'user', content: prompt },
    ],
    max_tokens: 4096,
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
