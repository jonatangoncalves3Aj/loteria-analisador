import { create } from 'zustand';
import type { Combination, DrawResult, GameConfig, NumberStats } from '../types';
import { GAMES } from '../types';
import { fetchLastNDraws } from '../services/loteriaApi';
import { computeDistribution, computeStats, computeSuperSeteColumnStats } from '../utils/statistics';
import { generateCombinations, generateSuperSeteCombinations } from '../utils/generator';
import type { DistributionStats } from '../utils/statistics';

interface LoteriaState {
  selectedGame: GameConfig;
  draws: DrawResult[];
  stats: NumberStats[];
  columnStats: NumberStats[][];
  distribution: DistributionStats;
  combinations: Combination[];
  loading: boolean;
  error: string | null;
  historySize: number;
  combinationCount: number;
  activeTab: 'stats' | 'combinations';

  selectGame: (game: GameConfig) => void;
  loadHistory: () => Promise<void>;
  generateCombs: () => void;
  setHistorySize: (n: number) => void;
  setCombinationCount: (n: number) => void;
  setActiveTab: (tab: 'stats' | 'combinations') => void;
}

export const useLoteriaStore = create<LoteriaState>((set, get) => ({
  selectedGame: GAMES[0],
  draws: [],
  stats: [],
  columnStats: [],
  distribution: { avgEven: 0, avgOdd: 0, avgConsecutive: 0, avgLow: 0, avgHigh: 0 },
  combinations: [],
  loading: false,
  error: null,
  historySize: 200,
  combinationCount: 3,
  activeTab: 'stats',

  selectGame: (game) => {
    set({ selectedGame: game, draws: [], stats: [], columnStats: [], combinations: [], error: null });
    get().loadHistory();
  },

  loadHistory: async () => {
    const { selectedGame, historySize } = get();
    set({ loading: true, error: null });
    try {
      const draws = await fetchLastNDraws(selectedGame, historySize);
      if (draws.length === 0) {
        set({ loading: false, error: 'Não foi possível obter os dados da API da Caixa. Verifique sua conexão.' });
        return;
      }
      const stats = computeStats(draws, selectedGame);
      const distribution = computeDistribution(draws, selectedGame);
      const columnStats = selectedGame.isSuperSete ? computeSuperSeteColumnStats(draws) : [];
      set({ draws, stats, columnStats, distribution, loading: false });
    } catch (e) {
      set({ loading: false, error: 'Erro ao carregar histórico de concursos.' });
    }
  },

  generateCombs: () => {
    const { stats, columnStats, distribution, selectedGame, combinationCount } = get();
    if (selectedGame.isSuperSete) {
      const combinations = generateSuperSeteCombinations(columnStats, combinationCount);
      set({ combinations, activeTab: 'combinations' });
    } else {
      const combinations = generateCombinations(stats, distribution, selectedGame, combinationCount);
      set({ combinations, activeTab: 'combinations' });
    }
  },

  setHistorySize: (n) => {
    set({ historySize: n });
    get().loadHistory();
  },

  setCombinationCount: (n) => set({ combinationCount: n }),

  setActiveTab: (tab) => set({ activeTab: tab }),
}));
