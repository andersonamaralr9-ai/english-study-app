export type LevelRequirement = {
  label: string
  current: number
  target: number
  unit: string
}

export type LevelProgressResult = {
  level: string
  nextLevel: string | null
  overallPercent: number
  requirements: LevelRequirement[]
  message: string
  milestone: string
}

const LEVEL_TARGETS: Record<string, {
  vocabCount: number
  masteredWords: number
  testAvg: number
  conversationCount: number
  writingCount: number
  grammarLessons: number
  studyMinutes: number
}> = {
  A1: { vocabCount: 100, masteredWords: 50, testAvg: 60, conversationCount: 10, writingCount: 5, grammarLessons: 4, studyMinutes: 300 },
  A2: { vocabCount: 300, masteredWords: 150, testAvg: 65, conversationCount: 25, writingCount: 15, grammarLessons: 8, studyMinutes: 600 },
  B1: { vocabCount: 600, masteredWords: 350, testAvg: 70, conversationCount: 50, writingCount: 30, grammarLessons: 12, studyMinutes: 1200 },
  B2: { vocabCount: 1200, masteredWords: 700, testAvg: 75, conversationCount: 100, writingCount: 50, grammarLessons: 14, studyMinutes: 2400 },
  C1: { vocabCount: 2500, masteredWords: 1500, testAvg: 80, conversationCount: 200, writingCount: 100, grammarLessons: 14, studyMinutes: 5000 },
}

const NEXT_LEVEL: Record<string, string | null> = {
  A1: 'A2', A2: 'B1', B1: 'B2', B2: 'C1', C1: null,
}

function clamp(value: number, max: number): number {
  return Math.min(Math.round((value / max) * 100), 100)
}

export function calculateLevelProgress(
  level: string,
  stats: {
    vocabCount: number
    masteredWords: number
    testAvg: number
    conversationCount: number
    writingCount: number
    grammarLessonsCompleted: number
    studyMinutes: number
  }
): LevelProgressResult {
  const targets = LEVEL_TARGETS[level] || LEVEL_TARGETS.A1
  const nextLevel = NEXT_LEVEL[level] || null

  const requirements: LevelRequirement[] = [
    { label: 'Vocabulário', current: stats.vocabCount, target: targets.vocabCount, unit: 'palavras' },
    { label: 'Palavras dominadas', current: stats.masteredWords, target: targets.masteredWords, unit: 'palavras' },
    { label: 'Média dos testes', current: stats.testAvg, target: targets.testAvg, unit: '%' },
    { label: 'Conversas', current: stats.conversationCount, target: targets.conversationCount, unit: 'conversas' },
    { label: 'Textos escritos', current: stats.writingCount, target: targets.writingCount, unit: 'textos' },
    { label: 'Lições de gramática', current: stats.grammarLessonsCompleted, target: targets.grammarLessons, unit: 'lições' },
    { label: 'Tempo de estudo', current: stats.studyMinutes, target: targets.studyMinutes, unit: 'min' },
  ]

  const percents = requirements.map(r => clamp(r.current, r.target))
  const overallPercent = Math.round(percents.reduce((a, b) => a + b, 0) / percents.length)

  let message: string
  let milestone: string

  if (overallPercent >= 95) {
    message = nextLevel ? `Você está pronto para avançar para o ${nextLevel}!` : 'Você dominou este nível!'
    milestone = 'complete'
  } else if (overallPercent >= 75) {
    message = nextLevel ? `Quase lá! Falta pouco para o ${nextLevel}.` : 'Continue praticando para dominar!'
    milestone = 'almost'
  } else if (overallPercent >= 50) {
    message = `Bom progresso no ${level}! Continue firme.`
    milestone = 'halfway'
  } else if (overallPercent >= 25) {
    message = `Você está avançando no ${level}. Cada dia conta!`
    milestone = 'started'
  } else {
    message = `Início da jornada no ${level}. Vamos lá!`
    milestone = 'beginning'
  }

  return { level, nextLevel, overallPercent, requirements, message, milestone }
}
