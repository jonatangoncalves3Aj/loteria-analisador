import type { DrawResult, GameConfig, NumberStats } from '../types';

export interface DistributionStats {
  avgEven: number;
  avgOdd: number;
  avgConsecutive: number;
  avgLow: number;
  avgHigh: number;
}

export interface PairFrequency {
  [key: string]: number; // "a,b" => weighted co-occurrence count (a < b)
}

export interface SumStats {
  mean: number;
  stdDev: number;
  p10: number;
  p90: number;
}

export interface RangeSlot {
  label: string;
  min: number;
  max: number;
  avgCount: number;
}

export interface RangeDistribution {
  slots: RangeSlot[];
}

// Repetition from previous draw stats
export interface RepeatStats {
  avgRepeat: number;         // avg number of digits that repeat from draw N-1 to draw N
  lastDrawNumbers: number[]; // numbers from the most recent draw (draws[0])
}

// Terminal digit (units digit) frequency
export interface TerminalDigitFreq {
  freq: Record<number, number>; // digit 0-9 → avg occurrences per draw
}

// ------------------------------------------------------------------
// Decay factor: each draw older gets multiplied by this.
// 0.97 → draw 100 contests ago weighs only ~5% of the latest draw.
// ------------------------------------------------------------------
const DECAY = 0.97;
const RECENT_WINDOW = 15;

export function computeStats(draws: DrawResult[], config: GameConfig): NumberStats[] {
  const total = draws.length;
  if (total === 0) return [];

  const weightedFreq: Record<number, number> = {};
  const rawFreq: Record<number, number> = {};
  const lastSeen: Record<number, number> = {};

  for (let n = config.minNum; n <= config.maxNum; n++) {
    weightedFreq[n] = 0;
    rawFreq[n] = 0;
    lastSeen[n] = 0;
  }

  // draws[0] = most recent → weight 1.0
  draws.forEach((draw, idx) => {
    const w = Math.pow(DECAY, idx);
    draw.numbers.forEach((n) => {
      weightedFreq[n] = (weightedFreq[n] ?? 0) + w;
      rawFreq[n] = (rawFreq[n] ?? 0) + 1;
      if (lastSeen[n] === 0) lastSeen[n] = draw.contest;
    });
  });

  // Recent window weighted frequency (last RECENT_WINDOW draws)
  const recentWeightedFreq: Record<number, number> = {};
  for (let n = config.minNum; n <= config.maxNum; n++) recentWeightedFreq[n] = 0;

  const recentDraws = draws.slice(0, RECENT_WINDOW);
  recentDraws.forEach((draw, idx) => {
    const w = Math.pow(DECAY, idx);
    draw.numbers.forEach((n) => {
      recentWeightedFreq[n] = (recentWeightedFreq[n] ?? 0) + w;
    });
  });

  // Normalize by total weight so comparison is rate-based
  const recentTotalWeight = recentDraws.reduce((acc, _, idx) => acc + Math.pow(DECAY, idx), 0);
  const fullTotalWeight = draws.reduce((acc, _, idx) => acc + Math.pow(DECAY, idx), 0);

  const latestContest = draws[0]?.contest ?? 0;
  const delay: Record<number, number> = {};
  for (let n = config.minNum; n <= config.maxNum; n++) {
    delay[n] = lastSeen[n] === 0 ? total : latestContest - lastSeen[n];
  }

  const allWF = Object.values(weightedFreq);
  const avgWF = allWF.reduce((a, b) => a + b, 0) / allWF.length;

  const stats: NumberStats[] = [];
  for (let n = config.minNum; n <= config.maxNum; n++) {
    const wf = weightedFreq[n];
    const d = delay[n];
    let temp: 'hot' | 'warm' | 'cold';
    if (wf >= avgWF * 1.15 && d <= avgWF * 0.9) {
      temp = 'hot';
    } else if (wf < avgWF * 0.85 || d > avgWF * 1.6) {
      temp = 'cold';
    } else {
      temp = 'warm';
    }

    // Trend detection: compare recent rate vs. historical rate
    const recentRate = recentTotalWeight > 0 ? recentWeightedFreq[n] / recentTotalWeight : 0;
    const historicalRate = fullTotalWeight > 0 ? weightedFreq[n] / fullTotalWeight : 0;
    let trend: 'rising' | 'stable' | 'falling';
    if (historicalRate === 0) {
      trend = recentRate > 0 ? 'rising' : 'stable';
    } else {
      const ratio = recentRate / historicalRate;
      if (ratio >= 1.3) trend = 'rising';
      else if (ratio <= 0.7) trend = 'falling';
      else trend = 'stable';
    }

    stats.push({
      number: n,
      frequency: rawFreq[n],
      delay: d,
      lastSeen: lastSeen[n],
      temp,
      trend,
    });
  }
  return stats;
}

// Weighted frequency map used internally by the generator
export function computeWeightedFreq(draws: DrawResult[], config: GameConfig): Record<number, number> {
  const freq: Record<number, number> = {};
  for (let n = config.minNum; n <= config.maxNum; n++) freq[n] = 0;
  draws.forEach((draw, idx) => {
    const w = Math.pow(DECAY, idx);
    draw.numbers.forEach((n) => { freq[n] = (freq[n] ?? 0) + w; });
  });
  return freq;
}

// Weighted pair co-occurrence
export function computePairStats(draws: DrawResult[]): PairFrequency {
  const pairs: PairFrequency = {};
  draws.forEach((draw, idx) => {
    const w = Math.pow(DECAY, idx);
    const nums = [...draw.numbers].sort((a, b) => a - b);
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const key = `${nums[i]},${nums[j]}`;
        pairs[key] = (pairs[key] ?? 0) + w;
      }
    }
  });
  return pairs;
}

// Sum distribution of historical draws
export function computeSumStats(draws: DrawResult[]): SumStats {
  if (draws.length === 0) return { mean: 0, stdDev: 0, p10: 0, p90: 0 };
  const sums = draws.map((d) => d.numbers.reduce((a, b) => a + b, 0));
  const mean = sums.reduce((a, b) => a + b, 0) / sums.length;
  const variance = sums.reduce((acc, s) => acc + Math.pow(s - mean, 2), 0) / sums.length;
  const stdDev = Math.sqrt(variance);
  const sorted = [...sums].sort((a, b) => a - b);
  const p10 = sorted[Math.floor(sorted.length * 0.1)];
  const p90 = sorted[Math.floor(sorted.length * 0.9)];
  return { mean, stdDev, p10, p90 };
}

// Historical number-range distribution (4 equal slots)
export function computeRangeDistribution(draws: DrawResult[], config: GameConfig): RangeDistribution {
  if (draws.length === 0) return { slots: [] };
  const totalNums = config.maxNum - config.minNum + 1;
  const slotSize = Math.ceil(totalNums / 4);
  const slots: RangeSlot[] = [];
  for (let i = 0; i < 4; i++) {
    const min = config.minNum + i * slotSize;
    const max = Math.min(config.minNum + (i + 1) * slotSize - 1, config.maxNum);
    const total = draws.reduce((acc, d) => acc + d.numbers.filter((n) => n >= min && n <= max).length, 0);
    slots.push({ label: `${min}–${max}`, min, max, avgCount: total / draws.length });
  }
  return { slots };
}

export function computeDistribution(draws: DrawResult[], config: GameConfig): DistributionStats {
  if (draws.length === 0) {
    return { avgEven: 0, avgOdd: 0, avgConsecutive: 0, avgLow: 0, avgHigh: 0 };
  }
  let totalEven = 0, totalOdd = 0, totalConsecutive = 0, totalLow = 0;
  const mid = Math.floor((config.minNum + config.maxNum) / 2);
  draws.forEach((draw) => {
    const sorted = [...draw.numbers].sort((a, b) => a - b);
    let consecutive = 0;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] === 1) consecutive++;
    }
    totalConsecutive += consecutive;
    sorted.forEach((n) => {
      if (n % 2 === 0) totalEven++; else totalOdd++;
      if (n <= mid) totalLow++;
    });
  });
  const n = draws.length;
  return {
    avgEven: totalEven / n,
    avgOdd: totalOdd / n,
    avgConsecutive: totalConsecutive / n,
    avgLow: totalLow / n,
    avgHigh: (draws[0].numbers.length * n - totalLow) / n,
  };
}

// Average number of digits that repeat from one draw to the next
export function computeRepeatStats(draws: DrawResult[]): RepeatStats {
  if (draws.length < 2) {
    return { avgRepeat: 0, lastDrawNumbers: draws[0]?.numbers ?? [] };
  }
  let totalRepeats = 0;
  for (let i = 0; i < draws.length - 1; i++) {
    const prevSet = new Set(draws[i + 1].numbers); // draw N-1 (older = higher index)
    const current = draws[i].numbers;               // draw N  (newer = lower index)
    const repeats = current.filter((n) => prevSet.has(n)).length;
    totalRepeats += repeats;
  }
  return {
    avgRepeat: totalRepeats / (draws.length - 1),
    lastDrawNumbers: draws[0].numbers,
  };
}

// Average count of each terminal digit (0-9) per draw
export function computeTerminalDigitFreq(draws: DrawResult[]): TerminalDigitFreq {
  if (draws.length === 0) return { freq: {} };
  const digitTotals: Record<number, number> = {};
  for (let d = 0; d <= 9; d++) digitTotals[d] = 0;
  draws.forEach((draw) => {
    draw.numbers.forEach((n) => {
      const digit = n % 10;
      digitTotals[digit]++;
    });
  });
  const freq: Record<number, number> = {};
  for (let d = 0; d <= 9; d++) {
    freq[d] = digitTotals[d] / draws.length;
  }
  return { freq };
}

// Trevo stats for +Milionária (trevos 1–6, pick 2)
export function computeTrevoStats(draws: DrawResult[]): NumberStats[] {
  const total = draws.length;
  if (total === 0) return [];
  const rawFreq: Record<number, number> = {};
  const weightedFreq: Record<number, number> = {};
  const lastSeen: Record<number, number> = {};
  for (let n = 1; n <= 6; n++) { rawFreq[n] = 0; weightedFreq[n] = 0; lastSeen[n] = 0; }

  draws.forEach((draw, idx) => {
    const w = Math.pow(DECAY, idx);
    (draw.trevos ?? []).forEach((n) => {
      rawFreq[n] = (rawFreq[n] ?? 0) + 1;
      weightedFreq[n] = (weightedFreq[n] ?? 0) + w;
      if (!lastSeen[n]) lastSeen[n] = draw.contest;
    });
  });

  const latestContest = draws[0]?.contest ?? 0;
  const allWF = Object.values(weightedFreq);
  const avgWF = allWF.reduce((a, b) => a + b, 0) / allWF.length;
  const fullTotalWeight = draws.reduce((acc, _, idx) => acc + Math.pow(DECAY, idx), 0);
  const recentDraws = draws.slice(0, RECENT_WINDOW);
  const recentTotalWeight = recentDraws.reduce((acc, _, idx) => acc + Math.pow(DECAY, idx), 0);
  const recentWF: Record<number, number> = {};
  for (let n = 1; n <= 6; n++) recentWF[n] = 0;
  recentDraws.forEach((draw, idx) => {
    const w = Math.pow(DECAY, idx);
    (draw.trevos ?? []).forEach((n) => { recentWF[n] = (recentWF[n] ?? 0) + w; });
  });

  return Array.from({ length: 6 }, (_, i) => {
    const n = i + 1;
    const wf = weightedFreq[n];
    const d = lastSeen[n] === 0 ? total : latestContest - lastSeen[n];
    const temp: 'hot' | 'warm' | 'cold' =
      wf >= avgWF * 1.15 && d <= avgWF * 0.9 ? 'hot' :
      wf < avgWF * 0.85 || d > avgWF * 1.6 ? 'cold' : 'warm';
    const recentRate = recentTotalWeight > 0 ? recentWF[n] / recentTotalWeight : 0;
    const historicalRate = fullTotalWeight > 0 ? wf / fullTotalWeight : 0;
    const ratio = historicalRate === 0 ? (recentRate > 0 ? 2 : 1) : recentRate / historicalRate;
    const trend: 'rising' | 'stable' | 'falling' =
      ratio >= 1.3 ? 'rising' : ratio <= 0.7 ? 'falling' : 'stable';
    return { number: n, frequency: rawFreq[n], delay: d, lastSeen: lastSeen[n], temp, trend };
  });
}

export function computeSuperSeteColumnStats(draws: DrawResult[], columns = 7): NumberStats[][] {
  return Array.from({ length: columns }, (_, col) => {
    const colDraws: DrawResult[] = draws.map((d) => ({
      ...d,
      numbers: [d.numbers[col]].filter((n) => n !== undefined),
    }));
    const config: GameConfig = {
      id: `col${col}`, name: `Coluna ${col + 1}`, apiSlug: '',
      minNum: 0, maxNum: 9, pickCount: 1, color: '', bgColor: '', drawDays: [],
    };
    return computeStats(colDraws, config);
  });
}
