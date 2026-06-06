export interface GameConfig {
  id: string;
  name: string;
  apiSlug: string;
  minNum: number;
  maxNum: number;
  pickCount: number;
  color: string;
  bgColor: string;
  isSuperSete?: boolean;
  // Days of week with draws: 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
  drawDays: number[];
  // +Milionária trevos (1–6, pick 2)
  hasTrevo?: boolean;
  trevoCount?: number;
  maxTrevo?: number;
}

export interface DrawResult {
  contest: number;
  date: string;
  numbers: number[];
  trevos?: number[]; // +Milionária only
}

export interface NumberStats {
  number: number;
  frequency: number;
  delay: number;
  lastSeen: number;
  temp: 'hot' | 'warm' | 'cold';
  trend: 'rising' | 'stable' | 'falling';
}

export interface Combination {
  numbers: number[];
  score: number;
  rationale: string;
  targetDate?: string;
  contestLabel?: string;
  diversityRank?: number;
  trevos?: number[]; // +Milionária only
}

export interface SuperSeteColumnStats {
  column: number;
  stats: NumberStats[];
}

export const GAMES: GameConfig[] = [
  {
    id: 'megasena',
    name: 'Mega-Sena',
    apiSlug: 'megasena',
    minNum: 1,
    maxNum: 60,
    pickCount: 6,
    color: 'text-green-700',
    bgColor: 'bg-green-600',
    drawDays: [3, 6], // Quarta e Sábado
  },
  {
    id: 'lotofacil',
    name: 'Lotofácil',
    apiSlug: 'lotofacil',
    minNum: 1,
    maxNum: 25,
    pickCount: 15,
    color: 'text-purple-700',
    bgColor: 'bg-purple-600',
    drawDays: [1, 2, 3, 4, 5, 6], // Segunda a Sábado
  },
  {
    id: 'quina',
    name: 'Quina',
    apiSlug: 'quina',
    minNum: 1,
    maxNum: 80,
    pickCount: 5,
    color: 'text-violet-700',
    bgColor: 'bg-violet-600',
    drawDays: [1, 2, 3, 4, 5, 6], // Segunda a Sábado
  },
  {
    id: 'lotomania',
    name: 'Lotomania',
    apiSlug: 'lotomania',
    minNum: 1,
    maxNum: 100,
    pickCount: 50,
    color: 'text-orange-700',
    bgColor: 'bg-orange-600',
    drawDays: [1, 3], // Segunda e Quarta
  },
  {
    id: 'duplasena',
    name: 'Dupla Sena',
    apiSlug: 'duplasena',
    minNum: 1,
    maxNum: 50,
    pickCount: 6,
    color: 'text-red-700',
    bgColor: 'bg-red-600',
    drawDays: [2, 4, 6], // Terça, Quinta e Sábado
  },
  {
    id: 'diadesorte',
    name: 'Dia de Sorte',
    apiSlug: 'diadesorte',
    minNum: 1,
    maxNum: 31,
    pickCount: 7,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-500',
    drawDays: [2, 4, 6], // Terça, Quinta e Sábado
  },
  {
    id: 'supersete',
    name: 'Super Sete',
    apiSlug: 'supersete',
    minNum: 0,
    maxNum: 9,
    pickCount: 7,
    color: 'text-blue-700',
    bgColor: 'bg-blue-600',
    isSuperSete: true,
    drawDays: [3, 6], // Quarta e Sábado
  },
  {
    id: 'maismilionaria',
    name: '+Milionária',
    apiSlug: 'maismilionaria',
    minNum: 1,
    maxNum: 50,
    pickCount: 6,
    color: 'text-pink-700',
    bgColor: 'bg-pink-600',
    drawDays: [3, 6], // Quarta e Sábado
    hasTrevo: true,
    trevoCount: 2,
    maxTrevo: 6,
  },
];
