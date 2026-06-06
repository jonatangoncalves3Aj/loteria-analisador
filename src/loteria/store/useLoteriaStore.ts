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
  computeRepeatStats,
  computeTerminalDigitFreq,
  computeTrevoStats,
} from '../utils/statistics';
import { generateCombinations, generateSuperSeteCombinations } from '../utils/generator';
import { getNextDrawDate, toInputDate, fromInputDate, formatDrawDate } from '../utils/drawSchedule';
import type {
  DistributionStats,
  PairFrequency,
  SumStats,
  RangeDistribution,
  RepeatStats,
  TerminalDigitFreq,
} from '../utils/statistics';

interface LoteriaState {
  selectedGame: GameConfig;
  draws: DrawResult[];
  stats: NumberStats[];
  columnStats: NumberStats[][];
  trevoStats: NumberStats[];
  distribution: DistributionStats;
  pairStats: PairFrequency;
  sumStats: SumStats;
  rangeDist: RangeDistribution;
  weightedFreq: Record<number, number>;
  repeatStats: RepeatStats;
  terminalDigitFreq: TerminalDigitFreq;
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

// Pick top-weighted trevos for +Milionária
function pickTrevos(trevoStats: NumberStats[], count: number): number[] {
  // Weight by frequency + temp boost + trend boost (same formula as generator)
  const weighted = trevoStats
    .map((s) => ({
      n: s.number,
      w: s.frequency * (s.temp === 'hot' ? 1.5 : s.temp === 'warm' ? 1.0 : 0.6) *
         (s.trend === 'rising' ? 1.2 : s.trend === 'falling' ? 0.85 : 1.0),
    }))
    .sort((a, b) => b.w - a.w);
  // Slightly randomize: pick from top 4 to avoid always same pair
  const pool = weighted.slice(0, Math.min(4, weighted.length));
  const selected = new Set<number>();
  while (selected.size < count && selected.size < pool.length) {
    const pick = pool[Math.floor(Math.random() * pool.length)];
    selected.add(pick.n);
  }
  // Fill if needed
  for (const t of weighted) {
    if (selected.size >= count) break;
    selected.add(t.n);
  }
  return Array.from(selected).sort((a, b) => a - b);
}

function resolveDrawDate(game: GameConfig, inputStr: string): string {
  const from = fromInputDate(inputStr);
  const next = getNextDrawDate(game, from);
  return formatDrawDate(next);
}

const todayInput = toInputDate(new Date());
const emptySum: SumStats = { mean: 0, stdDev: 0, p10: 0, p90: 0 };
const emptyDist: DistributionStats = { avgEven: 0, avgOdd: 0, avgConsecutive: 0, avgLow: 0, avgHigh: 0 };
const emptyRepeat: RepeatStats = { avgRepeat: 0, lastDrawNumbers: [] };
const emptyTerminal: TerminalDigitFreq = { freq: {} };

export const useLoteriaStore = create<LoteriaState>((set, get) => ({
  selectedGame: GAMES[0],
  draws: [],
  stats: [],
  columnStats: [],
  trevoStats: [],
  distribution: emptyDist,
  pairStats: {},
  sumStats: emptySum,
  rangeDist: { slots: [] },
  weightedFreq: {},
  repeatStats: emptyRepeat,
  terminalDigitFreq: emptyTerminal,
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
      selectedGame: game, draws: [], stats: [], columnStats: [], trevoStats: [],
      pairStats: {}, sumStats: emptySum, rangeDist: { slots: [] }, weightedFreq: {},
      combinations: [], error: null,
      resolvedDrawDate: resolveDrawDate(game, targetDateInput),
      repeatStats: emptyRepeat,
      terminalDigitFreq: emptyTerminal,
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
      const repeatStats = selectedGame.isSuperSete ? emptyRepeat : computeRepeatStats(draws);
      const terminalDigitFreq = selectedGame.isSuperSete ? emptyTerminal : computeTerminalDigitFreq(draws);
      const trevoStats = selectedGame.hasTrevo ? computeTrevoStats(draws) : [];

      set({
        draws, stats, columnStats, trevoStats, distribution,
        pairStats, sumStats, rangeDist, weightedFreq,
        repeatStats, terminalDigitFreq,
        loading: false,
      });
    } catch {
      set({ loading: false, error: 'Erro ao carregar histórico de concursos.' });
    }
  },

  generateCombs: () => {
    const {
      stats, columnStats, trevoStats, distribution, selectedGame, combinationCount,
      resolvedDrawDate, pairStats, sumStats, rangeDist, weightedFreq,
      repeatStats, terminalDigitFreq,
    } = get();
    let combinations: Combination[];
    if (selectedGame.isSuperSete) {
      combinations = generateSuperSeteCombinations(columnStats, combinationCount);
    } else {
      combinations = generateCombinations(
        stats, distribution, selectedGame, combinationCount,
        pairStats, sumStats, rangeDist, weightedFreq,
        repeatStats, terminalDigitFreq,
      );
      // Attach trevo suggestions for +Milionária
      if (selectedGame.hasTrevo && trevoStats.length > 0) {
        combinations = combinations.map((c) => ({
          ...c,
          trevos: pickTrevos(trevoStats, selectedGame.trevoCount ?? 2),
        }));
      }
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
