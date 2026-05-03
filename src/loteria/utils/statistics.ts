import type { DrawResult, GameConfig, NumberStats } from '../types';

export interface DistributionStats {
  avgEven: number;
  avgOdd: number;
  avgConsecutive: number;
  avgLow: number;
  avgHigh: number;
}

export function computeStats(draws: DrawResult[], config: GameConfig): NumberStats[] {
  const total = draws.length;
  if (total === 0) return [];

  const freq: Record<number, number> = {};
  const lastSeen: Record<number, number> = {};

  for (let n = config.minNum; n <= config.maxNum; n++) {
    freq[n] = 0;
    lastSeen[n] = 0;
  }

  draws.forEach((draw, idx) => {
    draw.numbers.forEach((n) => {
      freq[n] = (freq[n] ?? 0) + 1;
      if (lastSeen[n] === 0) lastSeen[n] = draw.contest;
    });
  });

  const latestContest = draws[0]?.contest ?? 0;
  const delay: Record<number, number> = {};
  for (let n = config.minNum; n <= config.maxNum; n++) {
    delay[n] = lastSeen[n] === 0 ? total : latestContest - lastSeen[n];
  }

  const allFreqs = Object.values(freq);
  const avgFreq = allFreqs.reduce((a, b) => a + b, 0) / allFreqs.length;

  const stats: NumberStats[] = [];
  for (let n = config.minNum; n <= config.maxNum; n++) {
    const f = freq[n];
    const d = delay[n];
    let temp: 'hot' | 'warm' | 'cold';
    if (f >= avgFreq * 1.1 && d <= avgFreq * 0.8) {
      temp = 'hot';
    } else if (f < avgFreq * 0.8 || d > avgFreq * 1.5) {
      temp = 'cold';
    } else {
      temp = 'warm';
    }
    stats.push({ number: n, frequency: f, delay: d, lastSeen: lastSeen[n], temp });
  }

  return stats;
}

export function computeDistribution(draws: DrawResult[], config: GameConfig): DistributionStats {
  if (draws.length === 0) {
    return { avgEven: 0, avgOdd: 0, avgConsecutive: 0, avgLow: 0, avgHigh: 0 };
  }

  let totalEven = 0;
  let totalOdd = 0;
  let totalConsecutive = 0;
  let totalLow = 0;
  const mid = Math.floor((config.minNum + config.maxNum) / 2);

  draws.forEach((draw) => {
    const sorted = [...draw.numbers].sort((a, b) => a - b);
    let consecutive = 0;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] === 1) consecutive++;
    }
    totalConsecutive += consecutive;
    sorted.forEach((n) => {
      if (n % 2 === 0) totalEven++;
      else totalOdd++;
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

export function computeSuperSeteColumnStats(
  draws: DrawResult[],
  columns = 7
): NumberStats[][] {
  return Array.from({ length: columns }, (_, col) => {
    const colDraws: DrawResult[] = draws.map((d) => ({
      ...d,
      numbers: [d.numbers[col]].filter((n) => n !== undefined),
    }));
    const config: GameConfig = {
      id: `col${col}`,
      name: `Coluna ${col + 1}`,
      apiSlug: '',
      minNum: 0,
      maxNum: 9,
      pickCount: 1,
      color: '',
      bgColor: '',
    };
    return computeStats(colDraws, config);
  });
}
