import type { Combination, GameConfig, NumberStats } from '../types';
import type {
  DistributionStats,
  PairFrequency,
  SumStats,
  RangeDistribution,
} from './statistics';

// ─── Helpers ────────────────────────────────────────────────────────────────

function weightedSample(
  pool: NumberStats[],
  weightedFreq: Record<number, number>,
  count: number
): number[] {
  // Weights: base weight from weighted frequency + temperature boost
  const weights = pool.map((s) => {
    const wf = weightedFreq[s.number] ?? 1;
    const tempBoost = s.temp === 'hot' ? 1.5 : s.temp === 'warm' ? 1.0 : 0.6;
    return wf * tempBoost;
  });
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const selected = new Set<number>();

  let attempts = 0;
  while (selected.size < count && attempts < count * 200) {
    attempts++;
    let r = Math.random() * totalWeight;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0 && !selected.has(pool[i].number)) {
        selected.add(pool[i].number);
        break;
      }
    }
  }
  // Fill if still short
  for (const s of pool) {
    if (selected.size >= count) break;
    selected.add(s.number);
  }
  return Array.from(selected);
}

function countConsecutive(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b);
  let max = 0, cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] === 1) { cur++; max = Math.max(max, cur); }
    else cur = 1;
  }
  return max;
}

// Average weighted pair affinity for a combination
function pairAffinityScore(nums: number[], pairs: PairFrequency): number {
  if (!pairs || Object.keys(pairs).length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  let total = 0, count = 0;
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      total += pairs[`${sorted[i]},${sorted[j]}`] ?? 0;
      count++;
    }
  }
  return count > 0 ? total / count : 0;
}

// Is the sum of the combination within the historical sweet spot?
function sumInRange(nums: number[], sumStats: SumStats): boolean {
  if (sumStats.p10 === 0 && sumStats.p90 === 0) return true;
  const s = nums.reduce((a, b) => a + b, 0);
  return s >= sumStats.p10 && s <= sumStats.p90;
}

// Sum position score: 0 (at edges) → 1 (at mean)
function sumProximityScore(nums: number[], sumStats: SumStats): number {
  if (sumStats.stdDev === 0) return 1;
  const s = nums.reduce((a, b) => a + b, 0);
  const z = Math.abs(s - sumStats.mean) / sumStats.stdDev;
  return Math.max(0, 1 - z / 2); // z=0 → 1.0, z=2 → 0.0
}

// How well does the combination match historical range distribution?
function rangeBalanceScore(nums: number[], rangeDist: RangeDistribution): number {
  if (!rangeDist.slots || rangeDist.slots.length === 0) return 0;
  let score = 0;
  for (const slot of rangeDist.slots) {
    const actual = nums.filter((n) => n >= slot.min && n <= slot.max).length;
    const expected = slot.avgCount;
    const diff = Math.abs(actual - expected);
    if (diff <= 0.5) score += 10;
    else if (diff <= 1) score += 5;
    else if (diff <= 2) score += 1;
    else score -= 4 * Math.floor(diff);
  }
  return score;
}

// ─── Main scorer ────────────────────────────────────────────────────────────

function scoreCombination(
  nums: number[],
  stats: NumberStats[],
  dist: DistributionStats,
  config: GameConfig,
  pairs: PairFrequency,
  sumStats: SumStats,
  rangeDist: RangeDistribution,
  weightedFreq: Record<number, number>,
): { score: number; rationale: string } {
  const statsMap = new Map(stats.map((s) => [s.number, s]));
  const hot = nums.filter((n) => statsMap.get(n)?.temp === 'hot').length;
  const warm = nums.filter((n) => statsMap.get(n)?.temp === 'warm').length;
  const cold = nums.length - hot - warm;
  const even = nums.filter((n) => n % 2 === 0).length;
  const odd = nums.length - even;
  const maxConsec = countConsecutive(nums);
  const mid = Math.floor((config.minNum + config.maxNum) / 2);
  const low = nums.filter((n) => n <= mid).length;
  const combinationSum = nums.reduce((a, b) => a + b, 0);

  let score = 0;
  const parts: string[] = [];

  // 1. Par/ímpar vs histórico (max 20 pts)
  const evenDiff = Math.abs(even - dist.avgEven);
  if (evenDiff <= 0.5) { score += 20; parts.push('par/ímpar ótimo'); }
  else if (evenDiff <= 1.5) { score += 12; }
  else if (evenDiff <= 2.5) { score += 4; }
  else score -= 8;

  // 2. Sequências consecutivas (max 15 pts)
  if (maxConsec <= 2) { score += 15; }
  else if (maxConsec === 3) { score += 7; }
  else if (maxConsec === 4) { score -= 5; }
  else { score -= 15; parts.push(`seq longa (${maxConsec})`); }

  // 3. Temperatura equilibrada (max 15 pts)
  if (hot > 0 && warm > 0 && cold > 0) { score += 15; }
  else if (hot > 0 && (warm > 0 || cold > 0)) { score += 8; }

  // 4. Distribuição baixo/alto (max 10 pts)
  const lowDiff = Math.abs(low - dist.avgLow);
  if (lowDiff <= 0.5) score += 10;
  else if (lowDiff <= 1.5) score += 5;
  else if (lowDiff > 3) score -= 6;

  // 5. SOMA histórica — NOVO (max 20 pts)
  const sumScore = Math.round(sumProximityScore(nums, sumStats) * 20);
  score += sumScore;
  if (sumScore >= 16) parts.push(`soma ${combinationSum} ✓`);
  else if (sumScore < 8) parts.push(`soma ${combinationSum} fora da faixa`);

  // 6. EQUILÍBRIO DE FAIXA — NOVO (max 20 pts)
  const rb = rangeBalanceScore(nums, rangeDist);
  const rbNorm = Math.min(20, Math.max(-10, rb));
  score += rbNorm;
  if (rbNorm >= 15) parts.push('faixas balanceadas ✓');

  // 7. AFINIDADE DE PARES — NOVO (bonus até +10 pts)
  if (Object.keys(pairs).length > 0) {
    const maxPossibleAff = Math.max(...Object.values(pairs));
    const aff = pairAffinityScore(nums, pairs);
    const affNorm = Math.min(10, Math.round((aff / (maxPossibleAff || 1)) * 10));
    score += affNorm;
    if (affNorm >= 7) parts.push('pares frequentes ✓');
  }

  // Normalize 0–100
  score = Math.max(0, Math.min(100, score));

  const rationale = [
    `${hot}🔥 ${warm}🌡 ${cold}🧊`,
    `${even}par/${odd}ímpar`,
    maxConsec > 1 ? `seq.${maxConsec}` : 'sem seq.',
    ...parts,
  ].join(' · ');

  return { score, rationale };
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function generateCombinations(
  stats: NumberStats[],
  dist: DistributionStats,
  config: GameConfig,
  count: number,
  pairs: PairFrequency = {},
  sumStats: SumStats = { mean: 0, stdDev: 0, p10: 0, p90: 0 },
  rangeDist: RangeDistribution = { slots: [] },
  weightedFreq: Record<number, number> = {},
): Combination[] {
  // Ensure weightedFreq has all numbers
  const wf = { ...weightedFreq };
  for (const s of stats) {
    if (!(s.number in wf)) wf[s.number] = s.frequency;
  }

  const candidates: Combination[] = [];
  const attemptsPerCandidate = 8;
  const totalAttempts = Math.max(count * 20, 80);

  for (let i = 0; i < totalAttempts; i++) {
    // Generate a candidate via weighted sampling
    let nums = weightedSample(stats, wf, config.pickCount);

    // Try to fix sum if out of range (up to attemptsPerCandidate swaps)
    for (let attempt = 0; attempt < attemptsPerCandidate; attempt++) {
      if (sumInRange(nums, sumStats)) break;
      // Replace highest or lowest number to adjust sum
      const currentSum = nums.reduce((a, b) => a + b, 0);
      const sorted = [...nums].sort((a, b) => a - b);
      const numSet = new Set(nums);

      if (currentSum > sumStats.p90) {
        // Replace highest with a lower random number
        const toReplace = sorted[sorted.length - 1];
        const candidates2 = stats
          .filter((s) => !numSet.has(s.number) && s.number < toReplace)
          .sort((a, b) => (wf[b.number] ?? 0) - (wf[a.number] ?? 0));
        if (candidates2.length > 0) {
          const pick = candidates2[Math.floor(Math.random() * Math.min(5, candidates2.length))];
          nums = nums.map((n) => (n === toReplace ? pick.number : n));
        }
      } else if (currentSum < sumStats.p10) {
        // Replace lowest with a higher random number
        const toReplace = sorted[0];
        const candidates2 = stats
          .filter((s) => !numSet.has(s.number) && s.number > toReplace)
          .sort((a, b) => (wf[b.number] ?? 0) - (wf[a.number] ?? 0));
        if (candidates2.length > 0) {
          const pick = candidates2[Math.floor(Math.random() * Math.min(5, candidates2.length))];
          nums = nums.map((n) => (n === toReplace ? pick.number : n));
        }
      }
    }

    const { score, rationale } = scoreCombination(nums, stats, dist, config, pairs, sumStats, rangeDist, wf);
    candidates.push({ numbers: [...nums].sort((a, b) => a - b), score, rationale });
  }

  // Deduplicate and return top-scored
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

export function generateSuperSeteCombinations(
  columnStats: NumberStats[][],
  count: number
): Combination[] {
  const candidates: Combination[] = [];
  for (let i = 0; i < count * 10; i++) {
    const nums = columnStats.map((col) => {
      const hot = col.filter((s) => s.temp === 'hot');
      const warm = col.filter((s) => s.temp === 'warm');
      const pool = hot.length > 0 ? hot : warm.length > 0 ? warm : col;
      return pool[Math.floor(Math.random() * pool.length)]?.number ?? 0;
    });
    const hot = nums.filter((_, idx) =>
      columnStats[idx]?.find((s) => s.number === nums[idx])?.temp === 'hot'
    ).length;
    const score = Math.round(50 + (hot / nums.length) * 50);
    candidates.push({ numbers: nums, score, rationale: `${hot} colunas quentes de ${nums.length}` });
  }
  const seen = new Set<string>();
  return candidates
    .filter((c) => { const k = c.numbers.join(','); if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}
