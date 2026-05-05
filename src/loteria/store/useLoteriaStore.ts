import { create } from 'zustand';
import type { Combination, DrawResult, GameConfig, NumberStats } from '../types';
import { GAMES } from '../types';
import { fetchLastNDraws } from '../services/loteriaApi';
import {
  computeDistribution,
  computeStats,
  computeWeightedFreq,
  computePairStats,
  computeSumStats,
  computeRangeDistribution,
  computeSuperSeteColumnStats,
} from '../utils/statistics';
import { generateCombinations, generateSuperSeteCombinations } from '../utils/generator';
import { getNextDrawDate, toInputDate, fromInputDate, formatDrawDate } from '../utils/drawSchedule';
import type {
  DistributionStats,
  PairFrequency,
  SumStats,
  RangeDistribution,
} from '../utils/statistics';

interface LoteriaState {
  selectedGame: GameConfig;
  draws: DrawResult[];
  stats: NumberStats[];
  columnStats: NumberStats[][];
  distribution: DistributionStats;
  pairStats: PairFrequency;
  sumStats: SumStats;
  rangeDist: RangeDistribution;
  weightedFreq: Record<number, number>;
  combinations: Combination[];
  loading: boolean;
  error: string | null;
  historySize: number;
  combinationCount: number;
  activeTab: 'stats' | 'combinations';
  targetDateInput: string;
  resolvedDrawDate: string;

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
const emptySum: SumStats = { mean: 0, stdDev: 0, p10: 0, p90: 0 };
const emptyDist: DistributionStats = { avgEven: 0, avgOdd: 0, avgConsecutive: 0, avgLow: 0, avgHigh: 0 };

export const useLoteriaStore = create<LoteriaState>((set, get) => ({
  selectedGame: GAMES[0],
  draws: [],
  stats: [],
  columnStats: [],
  distribution: emptyDist,
  pairStats: {},
  sumStats: emptySum,
  rangeDist: { slots: [] },
  weightedFreq: {},
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
      selectedGame: game, draws: [], stats: [], columnStats: [],
      pairStats: {}, sumStats: emptySum, rangeDist: { slots: [] }, weightedFreq: {},
      combinations: [], error: null,
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
      const pairStats = selectedGame.isSuperSete ? {} : computePairStats(draws);
      const sumStats = selectedGame.isSuperSete ? emptySum : computeSumStats(draws);
      const rangeDist = selectedGame.isSuperSete
        ? { slots: [] }
        : computeRangeDistribution(draws, selectedGame);
      const weightedFreq = computeWeightedFreq(draws, selectedGame);
      set({ draws, stats, columnStats, distribution, pairStats, sumStats, rangeDist, weightedFreq, loading: false });
    } catch {
      set({ loading: false, error: 'Erro ao carregar histórico de concursos.' });
    }
  },

  generateCombs: () => {
    const {
      stats, columnStats, distribution, selectedGame, combinationCount,
      resolvedDrawDate, pairStats, sumStats, rangeDist, weightedFreq,
    } = get();
    let combinations: Combination[];
    if (selectedGame.isSuperSete) {
      combinations = generateSuperSeteCombinations(columnStats, combinationCount);
    } else {
      combinations = generateCombinations(
        stats, distribution, selectedGame, combinationCount,
        pairStats, sumStats, rangeDist, weightedFreq,
      );
    }
    combinations = combinations.map((c) => ({ ...c, targetDate: resolvedDrawDate }));
    set({ combinations, activeTab: 'combinations' });
  },

  setHistorySize: (n) => { set({ historySize: n }); get().loadHistory(); },
  setCombinationCount: (n) => set({ combinationCount: n }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setTargetDate: (dateInput) => {
    const { selectedGame } = get();
    set({ targetDateInput: dateInput, resolvedDrawDate: resolveDrawDate(selectedGame, dateInput), combinations: [] });
  },
}));
