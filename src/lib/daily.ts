export type DailyChallenge = {
  type: 'conversation' | 'writing' | 'listening' | 'vocabulary' | 'grammar'
  title: string
  description: string
  prompt: string
  icon: string
  href: string
}

const CHALLENGES: DailyChallenge[] = [
  { type: 'conversation', title: 'Fale sobre seu café da manhã', description: 'Converse com a IA sobre o que você comeu hoje de manhã.', prompt: 'I want to practice talking about my breakfast today.', icon: '💬', href: '/conversacao' },
  { type: 'writing', title: 'Escreva sobre seu fim de semana', description: 'Descreva o que fez ou planeja fazer no fim de semana.', prompt: 'Write about your weekend plans or what you did last weekend.', icon: '✍️', href: '/escrita' },
  { type: 'listening', title: 'Ditado: 5 frases', description: 'Ouça e escreva 5 frases em inglês corretamente.', prompt: '', icon: '👂', href: '/escuta' },
  { type: 'vocabulary', title: 'Adicione 5 palavras novas', description: 'Aprenda 5 palavras novas relacionadas a comida.', prompt: '', icon: '📚', href: '/vocabulario' },
  { type: 'conversation', title: 'Peça algo em um restaurante', description: 'Simule que você está em um restaurante e faça seu pedido.', prompt: 'I want to practice ordering food at a restaurant.', icon: '🍽️', href: '/conversacao' },
  { type: 'writing', title: 'Descreva sua casa', description: 'Escreva um parágrafo descrevendo onde você mora.', prompt: 'Describe your house or apartment.', icon: '🏠', href: '/escrita' },
  { type: 'conversation', title: 'Fale sobre seu trabalho', description: 'Conte para a IA o que você faz no trabalho.', prompt: 'I want to talk about my job and what I do every day.', icon: '💼', href: '/conversacao' },
  { type: 'listening', title: 'Pronúncia: repita 5 frases', description: 'Ouça e repita 5 frases, comparando sua pronúncia.', prompt: '', icon: '🗣️', href: '/escuta' },
  { type: 'vocabulary', title: 'Revise todas as palavras pendentes', description: 'Faça a revisão dos flashcards que estão vencidos.', prompt: '', icon: '🔄', href: '/vocabulario' },
  { type: 'writing', title: 'Escreva um email informal', description: 'Escreva um email para um amigo contando novidades.', prompt: 'Write an informal email to a friend telling them your news.', icon: '📧', href: '/escrita' },
  { type: 'conversation', title: 'Pergunte direções', description: 'Simule que está perdido e peça direções para alguém.', prompt: 'I want to practice asking for directions. I am lost in a city.', icon: '🗺️', href: '/conversacao' },
  { type: 'grammar', title: 'Estude uma lição de gramática', description: 'Leia e pratique uma lição do seu nível atual.', prompt: '', icon: '📖', href: '/gramatica' },
  { type: 'conversation', title: 'Fale sobre seus hobbies', description: 'Conte o que você gosta de fazer no tempo livre.', prompt: 'I want to talk about my hobbies and free time activities.', icon: '🎮', href: '/conversacao' },
  { type: 'writing', title: 'Descreva uma pessoa', description: 'Escreva sobre alguém que você admira (aparência e personalidade).', prompt: 'Describe a person you admire — their appearance and personality.', icon: '👤', href: '/escrita' },
]

export function getDailyChallenge(): DailyChallenge {
  const today = new Date()
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000)
  return CHALLENGES[dayOfYear % CHALLENGES.length]
}

export function getWordOfDay(): { english: string; portuguese: string; example: string; category: string } {
  const WORDS = [
    { english: 'breakfast', portuguese: 'café da manhã', example: 'I eat breakfast at 7 AM.', category: 'Comida' },
    { english: 'weather', portuguese: 'clima', example: 'The weather is nice today.', category: 'Clima' },
    { english: 'ready', portuguese: 'pronto', example: 'Are you ready to go?', category: 'Adjetivos' },
    { english: 'together', portuguese: 'juntos', example: 'We work together every day.', category: 'Frases do Dia a Dia' },
    { english: 'between', portuguese: 'entre', example: 'The store is between the bank and the school.', category: 'Frases do Dia a Dia' },
    { english: 'early', portuguese: 'cedo', example: 'I wake up early in the morning.', category: 'Frases do Dia a Dia' },
    { english: 'enough', portuguese: 'suficiente', example: 'Do you have enough time?', category: 'Adjetivos' },
    { english: 'happen', portuguese: 'acontecer', example: 'What happened yesterday?', category: 'Verbos Comuns' },
    { english: 'believe', portuguese: 'acreditar', example: 'I believe you can do it.', category: 'Verbos Comuns' },
    { english: 'different', portuguese: 'diferente', example: 'These two books are very different.', category: 'Adjetivos' },
    { english: 'usually', portuguese: 'geralmente', example: 'I usually go to bed at 10 PM.', category: 'Frases do Dia a Dia' },
    { english: 'improve', portuguese: 'melhorar', example: 'I want to improve my English.', category: 'Verbos Comuns' },
    { english: 'almost', portuguese: 'quase', example: 'We are almost there.', category: 'Frases do Dia a Dia' },
    { english: 'quickly', portuguese: 'rapidamente', example: 'She learns quickly.', category: 'Frases do Dia a Dia' },
  ]
  const today = new Date()
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000)
  return WORDS[dayOfYear % WORDS.length]
}
