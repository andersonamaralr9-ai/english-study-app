export type GrammarLesson = {
  id: string
  level: string
  order: number
  title: string
  titlePt: string
  description: string
  examples: { en: string; pt: string }[]
  rules: string[]
  practice: string
}

export const GRAMMAR_LESSONS: GrammarLesson[] = [
  // A1
  { id: 'a1-01', level: 'A1', order: 1, title: 'Verb To Be', titlePt: 'Verbo Ser/Estar',
    description: 'O verbo mais importante do inglês. Usado para dizer quem você é e como está.',
    examples: [
      { en: 'I am a student.', pt: 'Eu sou um estudante.' },
      { en: 'She is happy.', pt: 'Ela está feliz.' },
      { en: 'They are from Brazil.', pt: 'Eles são do Brasil.' },
      { en: 'It is cold today.', pt: 'Está frio hoje.' },
    ],
    rules: ['I → am', 'He/She/It → is', 'You/We/They → are', 'Negativo: add "not" (I am not, She is not)', 'Pergunta: inverta (Are you...? Is she...?)'],
    practice: 'Complete: I ___ a developer. She ___ from São Paulo. We ___ happy. It ___ a beautiful day.' },

  { id: 'a1-02', level: 'A1', order: 2, title: 'Present Simple', titlePt: 'Presente Simples',
    description: 'Para rotinas, fatos e coisas que acontecem regularmente.',
    examples: [
      { en: 'I work every day.', pt: 'Eu trabalho todo dia.' },
      { en: 'She likes coffee.', pt: 'Ela gosta de café.' },
      { en: 'They play soccer on weekends.', pt: 'Eles jogam futebol nos fins de semana.' },
    ],
    rules: ['I/You/We/They → verbo base (work, like, play)', 'He/She/It → verbo + s/es (works, likes, plays)', 'Negativo: do not / does not + verbo base', 'Pergunta: Do you...? Does she...?'],
    practice: 'Complete: She ___ (like) pizza. I ___ (work) at a company. He ___ (play) guitar.' },

  { id: 'a1-03', level: 'A1', order: 3, title: 'Articles: A, An, The', titlePt: 'Artigos: A, An, The',
    description: 'Quando usar "a", "an" e "the" antes de substantivos.',
    examples: [
      { en: 'I have a car.', pt: 'Eu tenho um carro.' },
      { en: 'She is an engineer.', pt: 'Ela é uma engenheira.' },
      { en: 'The sun is bright.', pt: 'O sol está brilhante.' },
    ],
    rules: ['a → antes de sons de consoante (a car, a house)', 'an → antes de sons de vogal (an apple, an hour)', 'the → algo específico/já mencionado', 'Sem artigo → coisas em geral (I like coffee)'],
    practice: 'Complete: I need ___ umbrella. She has ___ dog. ___ moon is beautiful tonight.' },

  { id: 'a1-04', level: 'A1', order: 4, title: 'Possessives', titlePt: 'Possessivos',
    description: 'Como dizer "meu", "seu", "dele", etc.',
    examples: [
      { en: 'This is my book.', pt: 'Este é meu livro.' },
      { en: 'Her name is Maria.', pt: 'O nome dela é Maria.' },
      { en: 'Their house is big.', pt: 'A casa deles é grande.' },
    ],
    rules: ['I → my', 'You → your', 'He → his', 'She → her', 'It → its', 'We → our', 'They → their'],
    practice: 'Complete: ___ (I) name is Anderson. ___ (she) car is red. ___ (they) children are young.' },

  { id: 'a1-05', level: 'A1', order: 5, title: 'Questions with WH', titlePt: 'Perguntas com WH',
    description: 'What, Where, When, Who, Why, How — as perguntas essenciais.',
    examples: [
      { en: 'What is your name?', pt: 'Qual é o seu nome?' },
      { en: 'Where do you live?', pt: 'Onde você mora?' },
      { en: 'How are you?', pt: 'Como você está?' },
    ],
    rules: ['What = O que/Qual', 'Where = Onde', 'When = Quando', 'Who = Quem', 'Why = Por quê', 'How = Como', 'How much/many = Quanto(s)'],
    practice: 'Complete: ___ is your phone number? ___ do you work? ___ old are you?' },

  { id: 'a1-06', level: 'A1', order: 6, title: 'Can / Can\'t', titlePt: 'Poder / Não Poder',
    description: 'Expressar habilidade e possibilidade.',
    examples: [
      { en: 'I can speak Portuguese.', pt: 'Eu sei falar português.' },
      { en: 'She can\'t swim.', pt: 'Ela não sabe nadar.' },
      { en: 'Can you help me?', pt: 'Você pode me ajudar?' },
    ],
    rules: ['Can + verbo base (sem "to")', 'Mesmo para todas as pessoas (I can, she can)', 'Negativo: cannot / can\'t', 'Pergunta: Can you...?'],
    practice: 'Complete: I ___ drive a car. She ___ (not) cook. ___ you speak English?' },

  // A2
  { id: 'a2-01', level: 'A2', order: 1, title: 'Past Simple', titlePt: 'Passado Simples',
    description: 'Para ações que aconteceram e terminaram no passado.',
    examples: [
      { en: 'I worked yesterday.', pt: 'Eu trabalhei ontem.' },
      { en: 'She went to the mall.', pt: 'Ela foi ao shopping.' },
      { en: 'They didn\'t come.', pt: 'Eles não vieram.' },
    ],
    rules: ['Regulares: verbo + ed (worked, played, studied)', 'Irregulares: forma própria (go→went, eat→ate, see→saw)', 'Negativo: did not (didn\'t) + verbo base', 'Pergunta: Did you...?'],
    practice: 'Complete: I ___ (go) to school yesterday. She ___ (not/eat) breakfast. ___ you ___ (see) the movie?' },

  { id: 'a2-02', level: 'A2', order: 2, title: 'Future: Going To', titlePt: 'Futuro com Going To',
    description: 'Para planos e intenções futuras.',
    examples: [
      { en: 'I am going to study tonight.', pt: 'Eu vou estudar hoje à noite.' },
      { en: 'She is going to travel next week.', pt: 'Ela vai viajar semana que vem.' },
    ],
    rules: ['am/is/are + going to + verbo base', 'Para planos decididos', 'Para previsões baseadas em evidência', 'Pergunta: Are you going to...?'],
    practice: 'Complete: I ___ going to ___ (buy) a new phone. She ___ going to ___ (visit) her family.' },

  { id: 'a2-03', level: 'A2', order: 3, title: 'Comparatives', titlePt: 'Comparativos',
    description: 'Comparar duas coisas ou pessoas.',
    examples: [
      { en: 'She is taller than me.', pt: 'Ela é mais alta que eu.' },
      { en: 'This book is more interesting.', pt: 'Este livro é mais interessante.' },
      { en: 'My car is better than yours.', pt: 'Meu carro é melhor que o seu.' },
    ],
    rules: ['Curtos (1 sílaba): + er (taller, faster, bigger)', 'Longos (2+ sílabas): more + adj (more beautiful)', 'Irregulares: good→better, bad→worse, far→farther', 'Sempre use "than" para comparar'],
    practice: 'Complete: São Paulo is ___ (big) than Campinas. English is ___ (easy) than Japanese.' },

  { id: 'a2-04', level: 'A2', order: 4, title: 'Present Continuous', titlePt: 'Presente Contínuo',
    description: 'Para ações que estão acontecendo agora.',
    examples: [
      { en: 'I am studying English.', pt: 'Eu estou estudando inglês.' },
      { en: 'She is working from home.', pt: 'Ela está trabalhando de casa.' },
    ],
    rules: ['am/is/are + verbo-ing', 'Para ações no momento', 'Para situações temporárias', 'Pergunta: Are you studying?'],
    practice: 'Complete: I ___ (study) right now. They ___ (not/work) today. What ___ she ___ (do)?' },

  // B1
  { id: 'b1-01', level: 'B1', order: 1, title: 'Present Perfect', titlePt: 'Presente Perfeito',
    description: 'Conectar passado com presente — experiências, ações recentes.',
    examples: [
      { en: 'I have visited Paris.', pt: 'Eu visitei Paris (em algum momento).' },
      { en: 'She has just arrived.', pt: 'Ela acabou de chegar.' },
      { en: 'Have you ever eaten sushi?', pt: 'Você já comeu sushi?' },
    ],
    rules: ['have/has + past participle', 'Para experiências de vida (ever/never)', 'Para ações recentes (just, already, yet)', 'Para situações que continuam (for, since)'],
    practice: 'Complete: I ___ never ___ (be) to Japan. She ___ already ___ (finish). ___ you ever ___ (try) Thai food?' },

  { id: 'b1-02', level: 'B1', order: 2, title: 'First Conditional', titlePt: 'Primeira Condicional',
    description: 'Situações reais/possíveis no futuro.',
    examples: [
      { en: 'If it rains, I will stay home.', pt: 'Se chover, eu vou ficar em casa.' },
      { en: 'If you study, you will pass.', pt: 'Se você estudar, vai passar.' },
    ],
    rules: ['If + present simple, will + verbo base', 'Para situações possíveis/prováveis', 'A ordem pode inverter: I will stay home if it rains', 'Unless = if not'],
    practice: 'Complete: If I ___ (have) time, I ___ (go) to the gym. If she ___ (not/study), she ___ (not/pass).' },

  { id: 'b1-03', level: 'B1', order: 3, title: 'Second Conditional', titlePt: 'Segunda Condicional',
    description: 'Situações imaginárias ou improváveis.',
    examples: [
      { en: 'If I had money, I would travel.', pt: 'Se eu tivesse dinheiro, viajaria.' },
      { en: 'If I were you, I would study more.', pt: 'Se eu fosse você, estudaria mais.' },
    ],
    rules: ['If + past simple, would + verbo base', 'Para situações irreais/imaginárias', '"If I were" (não "if I was") é mais formal', 'Would = iria/faria em português'],
    practice: 'Complete: If I ___ (be) rich, I ___ (buy) a house. If she ___ (speak) English, she ___ (get) the job.' },

  { id: 'b1-04', level: 'B1', order: 4, title: 'Passive Voice', titlePt: 'Voz Passiva',
    description: 'Quando o foco é na ação, não em quem fez.',
    examples: [
      { en: 'The book was written by Tolkien.', pt: 'O livro foi escrito por Tolkien.' },
      { en: 'English is spoken worldwide.', pt: 'Inglês é falado mundialmente.' },
    ],
    rules: ['to be + past participle', 'Present: is/are + done', 'Past: was/were + done', 'By + agente (opcional)'],
    practice: 'Complete: The car ___ (wash) every week. This song ___ (sing) by Adele. The email ___ (send) yesterday.' },
]

export function getLessonsForLevel(level: string): GrammarLesson[] {
  return GRAMMAR_LESSONS.filter(l => l.level === level).sort((a, b) => a.order - b.order)
}

export function getAllLessons(): GrammarLesson[] {
  return GRAMMAR_LESSONS.sort((a, b) => {
    const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1']
    const diff = levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level)
    return diff !== 0 ? diff : a.order - b.order
  })
}
