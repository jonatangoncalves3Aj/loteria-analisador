import type { Combination, GameConfig, NumberStats } from '../types';
import type {
  DistributionStats,
  PairFrequency,
  SumStats,
  RangeDistribution,
  RepeatStats,
  TerminalDigitFreq,
} from './statistics';

// ─── Helpers ────────────────────────────────────────────────────────────────

function weightedSample(
  pool: NumberStats[],
  weightedFreq: Record<number, number>,
  count: number
): number[] {
  if (pool.length === 0 || count <= 0) return [];
  // Weights: base weight from weighted frequency + temperature boost + trend boost
  const weights = pool.map((s) => {
    const wf = weightedFreq[s.number] ?? 1;
    const tempBoost = s.temp === 'hot' ? 1.5 : s.temp === 'warm' ? 1.0 : 0.6;
    const trendBoost = s.trend === 'rising' ? 1.2 : s.trend === 'falling' ? 0.85 : 1.0;
    return wf * tempBoost * trendBoost;
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

// Terminal digit penalty: -6 pts per number beyond 2 sharing the same units digit
function terminalDigitPenalty(nums: number[], termFreq: TerminalDigitFreq): number {
  if (!termFreq || Object.keys(termFreq.freq).length === 0) return 0;
  const digitCount: Record<number, number> = {};
  for (const n of nums) {
    const d = n % 10;
    digitCount[d] = (digitCount[d] ?? 0) + 1;
  }
  let penalty = 0;
  for (const d in digitCount) {
    const count = digitCount[d];
    if (count >= 3) {
      penalty += (count - 2) * 6;
    }
  }
  return penalty;
}

// Jaccard similarity between two number arrays
function jaccardSimilarity(a: number[], b: number[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const n of setA) { if (setB.has(n)) intersection++; }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
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
  termFreq: TerminalDigitFreq,
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

  // 5. SOMA histórica (max 20 pts)
  const sumScore = Math.round(sumProximityScore(nums, sumStats) * 20);
  score += sumScore;
  if (sumScore >= 16) parts.push(`soma ${combinationSum} ✓`);
  else if (sumScore < 8) parts.push(`soma ${combinationSum} fora da faixa`);

  // 6. EQUILÍBRIO DE FAIXA (max 20 pts)
  const rb = rangeBalanceScore(nums, rangeDist);
  const rbNorm = Math.min(20, Math.max(-10, rb));
  score += rbNorm;
  if (rbNorm >= 15) parts.push('faixas balanceadas ✓');

  // 7. AFINIDADE DE PARES (bonus até +10 pts)
  if (Object.keys(pairs).length > 0) {
    const maxPossibleAff = Math.max(...Object.values(pairs));
    const aff = pairAffinityScore(nums, pairs);
    const affNorm = Math.min(10, Math.round((aff / (maxPossibleAff || 1)) * 10));
    score += affNorm;
    if (affNorm >= 7) parts.push('pares frequentes ✓');
  }

  // 8. TENDÊNCIA RECENTE (bonus até +8 pts, penalidade até -3 pts)
  const rising = nums.filter((n) => statsMap.get(n)?.trend === 'rising').length;
  const falling = nums.filter((n) => statsMap.get(n)?.trend === 'falling').length;
  score += rising * 2;
  score -= falling * 1;
  if (rising >= 2) parts.push(`${rising} em alta ✓`);

  // 9. PENALIDADE DE DÍGITO TERMINAL (até -18 pts)
  const tdPenalty = terminalDigitPenalty(nums, termFreq);
  if (tdPenalty > 0) {
    score -= tdPenalty;
    parts.push(`dígitos repetidos -${tdPenalty}`);
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
  repeatStats: RepeatStats = { avgRepeat: 0, lastDrawNumbers: [] },
  termFreq: TerminalDigitFreq = { freq: {} },
): Combination[] {
  // Ensure weightedFreq has all numbers
  const wf = { ...weightedFreq };
  for (const s of stats) {
    if (!(s.number in wf)) wf[s.number] = s.frequency;
  }

  const candidates: Combination[] = [];
  const attemptsPerCandidate = 8;
  // 3.75× larger candidate pool for better selection quality
  const totalAttempts = Math.max(count * 60, 300);

  // Pre-compute forced repeat pool from last draw
  const forcedRepeatCount = Math.round(repeatStats.avgRepeat);
  const lastDrawSet = new Set(repeatStats.lastDrawNumbers);
  const lastDrawPool = stats.filter((s) => lastDrawSet.has(s.number));

  for (let i = 0; i < totalAttempts; i++) {
    // Force some numbers from the last draw to match historical repeat patterns
    let forcedNums: number[] = [];
    if (forcedRepeatCount > 0 && lastDrawPool.length > 0) {
      const actualForced = Math.min(forcedRepeatCount, config.pickCount - 1);
      forcedNums = weightedSample(lastDrawPool, wf, actualForced);
    }

    // Fill remaining slots from the full pool, excluding already-forced numbers
    const forcedSet = new Set(forcedNums);
    const remainingPool = stats.filter((s) => !forcedSet.has(s.number));
    const remainingCount = config.pickCount - forcedNums.length;
    const remainingNums = weightedSample(remainingPool, wf, remainingCount);

    let nums = [...forcedNums, ...remainingNums];

    // Try to fix sum if out of range (up to attemptsPerCandidate swaps)
    for (let attempt = 0; attempt < attemptsPerCandidate; attempt++) {
      if (sumInRange(nums, sumStats)) break;
      const currentSum = nums.reduce((a, b) => a + b, 0);
      const sorted = [...nums].sort((a, b) => a - b);
      const numSet = new Set(nums);

      if (currentSum > sumStats.p90) {
        const toReplace = sorted[sorted.length - 1];
        const candidates2 = stats
          .filter((s) => !numSet.has(s.number) && s.number < toReplace)
          .sort((a, b) => (wf[b.number] ?? 0) - (wf[a.number] ?? 0));
        if (candidates2.length > 0) {
          const pick = candidates2[Math.floor(Math.random() * Math.min(5, candidates2.length))];
          nums = nums.map((n) => (n === toReplace ? pick.number : n));
        }
      } else if (currentSum < sumStats.p10) {
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

    const { score, rationale } = scoreCombination(
      nums, stats, dist, config, pairs, sumStats, rangeDist, wf, termFreq,
    );
    candidates.push({ numbers: [...nums].sort((a, b) => a - b), score, rationale });
  }

  // Deduplicate and sort by score
  const seen = new Set<string>();
  const unique = candidates
    .filter((c) => {
      const key = c.numbers.join(',');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.score - a.score);

  if (unique.length === 0) return [];

  // Diversity-aware selection using Jaccard similarity
  const maxScore = unique[0].score;
  const qualityFloor = maxScore * 0.75;
  const JACCARD_THRESHOLD = 0.4;

  const selected: Combination[] = [];

  for (const candidate of unique) {
    if (selected.length >= count) break;

    if (selected.length === 0) {
      selected.push({ ...candidate, diversityRank: 1 });
      continue;
    }

    // Quality floor check
    if (candidate.score < qualityFloor) break;

    // Diversity check: must be sufficiently different from all already selected
    const tooSimilar = selected.some(
      (s) => jaccardSimilarity(candidate.numbers, s.numbers) >= JACCARD_THRESHOLD
    );

    if (!tooSimilar) {
      selected.push({ ...candidate, diversityRank: selected.length + 1 });
    }
  }

  // Fallback: fill with top remaining if diversity selection didn't reach count
  if (selected.length < count) {
    const selectedKeys = new Set(selected.map((s) => s.numbers.join(',')));
    for (const candidate of unique) {
      if (selected.length >= count) break;
      if (!selectedKeys.has(candidate.numbers.join(','))) {
        selected.push({ ...candidate, diversityRank: selected.length + 1 });
        selectedKeys.add(candidate.numbers.join(','));
      }
    }
  }

  return selected;
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
