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
}

export interface DrawResult {
  contest: number;
  date: string;
  numbers: number[];
}

export interface NumberStats {
  number: number;
  frequency: number;
  delay: number;
  lastSeen: number;
  temp: 'hot' | 'warm' | 'cold';
}

export interface Combination {
  numbers: number[];
  score: number;
  rationale: string;
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
  },
];
