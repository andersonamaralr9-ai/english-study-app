export const CLASS_SCHEDULE = [
  {
    day: 2, // Tuesday
    startTime: '08:15',
    endTime: '09:00',
    teacher: 'Rodrigo',
    type: 'Conversação',
    description: 'Aula de conversação com pouco vocabulário',
  },
  {
    day: 4, // Thursday
    startTime: '08:15',
    endTime: '09:00',
    teacher: 'Rodrigo',
    type: 'Conversação',
    description: 'Aula de conversação com pouco vocabulário',
  },
  {
    day: 5, // Friday
    startTime: '15:30',
    endTime: '17:00',
    teacher: 'Chris',
    type: 'Conversação + Vocabulário',
    description: 'Conversação, contexto, vocabulário e escuta',
  },
]

export const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export const VOCAB_CATEGORIES = [
  'Saudações',
  'Família',
  'Comida',
  'Trabalho',
  'Casa',
  'Corpo',
  'Roupas',
  'Clima',
  'Transporte',
  'Números',
  'Cores',
  'Animais',
  'Verbos Comuns',
  'Adjetivos',
  'Frases do Dia a Dia',
  'Tecnologia',
  'Viagem',
  'Saúde',
  'Esportes',
  'Outros',
]

export const CEFR_LEVELS = [
  { level: 'A1', minWords: 0, description: 'Iniciante' },
  { level: 'A2', minWords: 500, description: 'Básico' },
  { level: 'B1', minWords: 1000, description: 'Intermediário' },
  { level: 'B2', minWords: 2000, description: 'Intermediário Superior' },
  { level: 'C1', minWords: 4000, description: 'Avançado' },
  { level: 'C2', minWords: 8000, description: 'Proficiente' },
]

export function getCEFRLevel(wordCount: number, avgScore: number): { level: string; description: string } {
  const adjusted = Math.floor(wordCount * (avgScore / 100 || 0.5))
  for (let i = CEFR_LEVELS.length - 1; i >= 0; i--) {
    if (adjusted >= CEFR_LEVELS[i].minWords) return CEFR_LEVELS[i]
  }
  return CEFR_LEVELS[0]
}

export function getNextClass(): { day: string; teacher: string; startTime: string; type: string; daysUntil: number } | null {
  const now = new Date()
  const currentDay = now.getDay()
  const currentTime = now.getHours() * 60 + now.getMinutes()

  for (let offset = 0; offset < 7; offset++) {
    const checkDay = (currentDay + offset) % 7
    const classes = CLASS_SCHEDULE.filter((c) => c.day === checkDay)
    for (const cls of classes) {
      const [h, m] = cls.startTime.split(':').map(Number)
      const classTime = h * 60 + m
      if (offset === 0 && currentTime >= classTime) continue
      return {
        day: DAY_NAMES[checkDay],
        teacher: cls.teacher,
        startTime: cls.startTime,
        type: cls.type,
        daysUntil: offset,
      }
    }
  }
  return null
}
