import type { Combination, GameConfig, NumberStats } from '../types';
import type { DistributionStats } from './statistics';

function weightedSample(pool: NumberStats[], count: number): number[] {
  const weights = pool.map((s) => (s.temp === 'hot' ? 3 : s.temp === 'warm' ? 2 : 1));
  const total = weights.reduce((a, b) => a + b, 0);
  const selected = new Set<number>();

  let attempts = 0;
  while (selected.size < count && attempts < count * 100) {
    attempts++;
    let r = Math.random() * total;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        selected.add(pool[i].number);
        break;
      }
    }
  }

  // Fill remaining randomly if needed
  for (const s of pool) {
    if (selected.size >= count) break;
    selected.add(s.number);
  }

  return Array.from(selected);
}

function countConsecutive(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b);
  let max = 0;
  let cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] === 1) {
      cur++;
      max = Math.max(max, cur);
    } else {
      cur = 1;
    }
  }
  return max;
}

function scoreCombination(
  nums: number[],
  stats: NumberStats[],
  dist: DistributionStats,
  config: GameConfig
): { score: number; rationale: string } {
  const statsMap = new Map(stats.map((s) => [s.number, s]));
  const hot = nums.filter((n) => statsMap.get(n)?.temp === 'hot').length;
  const warm = nums.filter((n) => statsMap.get(n)?.temp === 'warm').length;
  const cold = nums.filter((n) => statsMap.get(n)?.temp === 'cold').length;
  const even = nums.filter((n) => n % 2 === 0).length;
  const odd = nums.length - even;
  const maxConsec = countConsecutive(nums);
  const mid = Math.floor((config.minNum + config.maxNum) / 2);
  const low = nums.filter((n) => n <= mid).length;

  let score = 50;

  // Par/ímpar vs histórico (±2 da média)
  const evenDiff = Math.abs(even - dist.avgEven);
  if (evenDiff <= 1) score += 20;
  else if (evenDiff <= 2) score += 10;
  else score -= 10;

  // Sem sequências longas
  if (maxConsec <= 2) score += 15;
  else if (maxConsec === 3) score += 5;
  else score -= 10;

  // Spread térmico equilibrado
  if (hot > 0 && warm > 0 && cold > 0) score += 15;
  else if (hot > 0 && (warm > 0 || cold > 0)) score += 8;

  // Distribuição baixo/alto
  const lowDiff = Math.abs(low - dist.avgLow);
  if (lowDiff <= 1) score += 10;
  else if (lowDiff > 3) score -= 5;

  score = Math.max(0, Math.min(100, score));

  const rationale = [
    `${hot} quente${hot !== 1 ? 's' : ''}`,
    `${warm} morna${warm !== 1 ? 's' : ''}`,
    `${cold} fria${cold !== 1 ? 's' : ''}`,
    `${even} par${even !== 1 ? 'es' : ''}/${odd} ímpar${odd !== 1 ? 'es' : ''}`,
    maxConsec > 1 ? `seq. máx ${maxConsec}` : 'sem sequência',
  ].join(' · ');

  return { score, rationale };
}

export function generateCombinations(
  stats: NumberStats[],
  dist: DistributionStats,
  config: GameConfig,
  count: number
): Combination[] {
  const candidates: Combination[] = [];
  const attempts = Math.max(count * 10, 50);

  for (let i = 0; i < attempts; i++) {
    const nums = weightedSample(stats, config.pickCount);
    const { score, rationale } = scoreCombination(nums, stats, dist, config);
    candidates.push({ numbers: [...nums].sort((a, b) => a - b), score, rationale });
  }

  // Deduplicate by sorted key, keep top scores
  const seen = new Set<string>();
  const unique = candidates.filter((c) => {
    const key = c.numbers.join(',');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.sort((a, b) => b.score - a.score).slice(0, count);
}

export function generateSuperSeteCombinations(
  columnStats: NumberStats[][],
  count: number
): Combination[] {
  const candidates: Combination[] = [];

  for (let i = 0; i < count * 10; i++) {
    const nums = columnStats.map((col) => {
      const hot = col.filter((s) => s.temp === 'hot');
      const pool = hot.length > 0 ? hot : col;
      return pool[Math.floor(Math.random() * pool.length)]?.number ?? 0;
    });
    const hot = nums.filter((_, idx) =>
      columnStats[idx]?.find((s) => s.number === nums[idx])?.temp === 'hot'
    ).length;
    const score = Math.round(50 + (hot / nums.length) * 50);
    candidates.push({
      numbers: nums,
      score,
      rationale: `${hot} colunas quentes de ${nums.length}`,
    });
  }

  const seen = new Set<string>();
  return candidates
    .filter((c) => {
      const key = c.numbers.join(',');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}
