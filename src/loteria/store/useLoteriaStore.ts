import { create } from 'zustand';
import type { Combination, DrawResult, GameConfig, NumberStats } from '../types';
import { GAMES } from '../types';
import { fetchLastNDraws } from '../services/loteriaApi';
import { computeDistribution, computeStats, computeSuperSeteColumnStats } from '../utils/statistics';
import { generateCombinations, generateSuperSeteCombinations } from '../utils/generator';
import { getNextDrawDate, toInputDate, fromInputDate, formatDrawDate } from '../utils/drawSchedule';
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
  targetDateInput: string;       // value of the date picker (YYYY-MM-DD)
  resolvedDrawDate: string;      // formatted date of the resolved draw

  selectGame: (game: GameConfig) => void;
  loadHistory: () => Promise<void>;
  generateCombs: () => void;
  setHistorySize: (n: number) => void;
  setCombinationCount: (n: number) => void;
  setActiveTab: (tab: 'stats' | 'combinations') => void;
  setTargetDate: (dateInput: string) => void;
}

function resolveDrawDate(game: GameConfig, inputStr: string): string {
  const from = fromInputDate(inputStr);
  const next = getNextDrawDate(game, from);
  return formatDrawDate(next);
}

const todayInput = toInputDate(new Date());

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
  targetDateInput: todayInput,
  resolvedDrawDate: resolveDrawDate(GAMES[0], todayInput),

  selectGame: (game) => {
    const { targetDateInput } = get();
    set({
      selectedGame: game,
      draws: [],
      stats: [],
      columnStats: [],
      combinations: [],
      error: null,
      resolvedDrawDate: resolveDrawDate(game, targetDateInput),
    });
    get().loadHistory();
  },

  loadHistory: async () => {
    const { selectedGame, historySize } = get();
    set({ loading: true, error: null });
    try {
      const draws = await fetchLastNDraws(selectedGame, historySize);
      if (draws.length === 0) {
        set({ loading: false, error: 'Não foi possível carregar os dados. Verifique sua conexão.' });
        return;
      }
      const stats = computeStats(draws, selectedGame);
      const distribution = computeDistribution(draws, selectedGame);
      const columnStats = selectedGame.isSuperSete ? computeSuperSeteColumnStats(draws) : [];
      set({ draws, stats, columnStats, distribution, loading: false });
    } catch {
      set({ loading: false, error: 'Erro ao carregar histórico de concursos.' });
    }
  },

  generateCombs: () => {
    const { stats, columnStats, distribution, selectedGame, combinationCount, resolvedDrawDate } = get();
    let combinations: Combination[];
    if (selectedGame.isSuperSete) {
      combinations = generateSuperSeteCombinations(columnStats, combinationCount);
    } else {
      combinations = generateCombinations(stats, distribution, selectedGame, combinationCount);
    }
    // Tag each combination with the target draw date
    combinations = combinations.map((c) => ({ ...c, targetDate: resolvedDrawDate }));
    set({ combinations, activeTab: 'combinations' });
  },

  setHistorySize: (n) => {
    set({ historySize: n });
    get().loadHistory();
  },

  setCombinationCount: (n) => set({ combinationCount: n }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  setTargetDate: (dateInput) => {
    const { selectedGame } = get();
    const resolvedDrawDate = resolveDrawDate(selectedGame, dateInput);
    set({ targetDateInput: dateInput, resolvedDrawDate, combinations: [] });
  },
}));
