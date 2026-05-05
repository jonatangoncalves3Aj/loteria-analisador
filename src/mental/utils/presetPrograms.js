import { createAffirmation } from './spacedRepetition'

export const PRESET_PROGRAMS = [
  {
    id:          'autoconfianca',
    label:       'Autoconfiança',
    emoji:       '💪',
    color:       '#74b9ff',
    description: 'Fortaleça sua segurança interior e presença',
    affirmations: [
      'Estou me tornando mais confiante e seguro a cada dia',
      'Acredito plenamente em minha capacidade de superar desafios',
      'Minha presença transmite segurança e respeito',
      'Mereço sucesso, amor e abundância em minha vida',
      'Cada conquista fortalece minha confiança interior',
      'Sou digno de ser visto, ouvido e valorizado',
      'Minha autoestima cresce com cada escolha positiva que faço',
    ],
  },
  {
    id:          'prosperidade',
    label:       'Prosperidade',
    emoji:       '💰',
    color:       '#55efc4',
    description: 'Reprograme sua mente para atrair riqueza e abundância',
    affirmations: [
      'Estou me tornando um ímã para oportunidades e riqueza',
      'O dinheiro flui para mim de formas esperadas e inesperadas',
      'Minha mentalidade de prosperidade se expande a cada dia',
      'Sou grato pela abundância crescente em todas as áreas da minha vida',
      'Minha relação com o dinheiro é saudável, positiva e próspera',
      'Cada decisão que tomo me aproxima da liberdade financeira',
      'Mereço prosperar e viver com abundância e gratidão',
    ],
  },
  {
    id:          'seducao',
    label:       'Sedução',
    emoji:       '🔥',
    color:       '#fd79a8',
    description: 'Desenvolva magnetismo, charme e poder de atração',
    affirmations: [
      'Estou me tornando mais magnético e irresistível a cada dia',
      'Minha presença atrai as pessoas certas de forma natural',
      'Exudo confiança, charme e carisma genuíno',
      'As pessoas se sentem energizadas e atraídas na minha presença',
      'Minha comunicação é clara, cativante e envolvente',
      'Meu corpo, mente e espírito irradiam atração natural',
      'Conecto-me profundamente com as pessoas que cruzam meu caminho',
    ],
  },
]

export function loadPresetAffirmations(programId, existing = []) {
  const program = PRESET_PROGRAMS.find(p => p.id === programId)
  if (!program) return existing

  const existingTexts = new Set(existing.map(a => a.text.toLowerCase().trim()))
  const newCards = program.affirmations
    .filter(text => !existingTexts.has(text.toLowerCase().trim()))
    .map(text => createAffirmation(text))

  return [...existing, ...newCards]
}
